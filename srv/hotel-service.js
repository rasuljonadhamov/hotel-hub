const cds = require("@sap/cds");
const LOG = cds.log("hotel");

// currency rates (cached for 1 hour)
const RATES_URL =
  process.env.RATES_URL || "https://open.er-api.com/v6/latest/USD";
const FALLBACK_RATES = { USD: 1, UZS: 12800, EUR: 0.92, RUB: 92 };
let ratesCache = { rates: null, fetchedAt: 0 };
async function getRates() {
  const ONE_HOUR = 60 * 60 * 1000;
  if (ratesCache.rates && Date.now() - ratesCache.fetchedAt < ONE_HOUR) {
    return ratesCache.rates;
  }
  try {
    const res = await fetch(RATES_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    ratesCache = { rates: json.rates, fetchedAt: Date.now() };
    LOG.info("Kurs yangilandi: 1 USD =", json.rates.UZS, "UZS");
    return json.rates;
  } catch (err) {
    LOG.warn("Tashqi API ishlamadi, zaxira kurs ishlatiladi:", err.message);
    return FALLBACK_RATES;
  }
}
const today = () => new Date().toISOString().slice(0, 10);
const round2 = (n) => Math.round(n * 100) / 100;

module.exports = class HotelService extends cds.ApplicationService {
  init() {
    const { Hotels, Rooms, Customers, Bookings } = this.entities;

    this.before("NEW", Bookings.drafts, (req) => {
      // only fill what the client did not send (Postman can send its own dates)
      const d = new Date();
      d.setDate(d.getDate() + 1);
      req.data.checkIn ??= d.toISOString().slice(0, 10);
      d.setDate(d.getDate() + 2);
      req.data.checkOut ??= d.toISOString().slice(0, 10);
      req.data.guests ??= 1;
    });

    this.before("CREATE", Bookings, async (req) => {
      const { maxNo } = await SELECT.one
        .from(Bookings)
        .columns("max(bookingNo) as maxNo");
      req.data.bookingNo = (maxNo ?? 1000) + 1;
      req.data.status = "N";
    });

    this.before(["CREATE", "UPDATE"], Bookings, async (req) => {
      const { ID, room_ID, customer_ID, checkIn, checkOut, guests } = req.data;

      // dates must be valid
      if (checkIn < today())
        req.error({
          status: 400,
          message: "Check-in sanasi o'tmishda bo'lishi mumkin emas",
          target: "checkIn",
        });
      if (checkOut <= checkIn)
        req.error({
          status: 400,
          message: "Check-out check-in'dan keyin bo'lishi kerak",
          target: "checkOut",
        });

      const room = await SELECT.one
        .from(Rooms, room_ID)
        .columns(
          "capacity",
          "pricePerNight",
          "hotel.name as hotelName",
          "hotel.isActive as hotelActive",
        );
      if (!room) return req.reject(404, "Xona topilmadi");
      if (!room.hotelActive)
        req.error(400, `${room.hotelName} hozircha bron qabul qilmaydi`);

      if (guests > room.capacity)
        req.error({
          status: 400,
          message: `Bu xonaga ko'pi bilan ${room.capacity} kishi sig'adi`,
          target: "guests",
        });

      // prevent double-booking
      const overlapping = await SELECT.from(Bookings).columns("ID", "bookingNo")
        .where`room_ID = ${room_ID} and status != 'X'
and checkIn < ${checkOut} and checkOut > ${checkIn}`;
      const conflict = overlapping.find((b) => b.ID !== ID);
      if (conflict)
        req.error(
          409,
          `Xona bu sanalarda band (bron No ${conflict.bookingNo})`,
        );

      const customer = await SELECT.one
        .from(Customers, customer_ID)
        .columns("userId", "isVip");
      if (!customer) return req.reject(404, "Mijoz topilmadi");

      // customers can only book for themselves
      const onlyCustomer =
        req.user.is("Customer") &&
        !req.user.is("Manager") &&
        !req.user.is("Admin");
      if (onlyCustomer && customer.userId !== req.user.id)
        req.error(403, "Faqat o'zingiz uchun bron qila olasiz");
      if (req.errors) return;

      // pricing
      const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000;
      let total = nights * Number(room.pricePerNight);
      if (nights >= 7) total *= 0.9; // weekly discount
      if (customer.isVip) total *= 0.95; // VIP -5%
      const rates = await getRates();
      req.data.nights = nights;
      req.data.totalPrice = round2(total);
      req.data.exchangeRate = rates.UZS;
      req.data.totalPriceUZS = round2(total * rates.UZS);
    });

    this.after("READ", Bookings, (result) => {
      const rows = Array.isArray(result) ? result : [result];
      for (const b of rows) {
        if (b?.status) b.statusCriticality = { N: 2, C: 3, X: 1 }[b.status];
      }
    });

    this.on("confirmBooking", Bookings, async (req) => {
      const { ID } = req.params[0];
      const b = await SELECT.one.from(Bookings, ID);
      if (!b) return req.reject(404, "Bron topilmadi");
      if (b.status !== "N")
        return req.reject(400, "Faqat 'New' holatidagi bron tasdiqlanadi");
      await UPDATE(Bookings, ID).with({ status: "C" });
      return SELECT.one.from(Bookings, ID);
    });

    // can't cancel within 24h of check-in
    this.on("cancelBooking", Bookings, async (req) => {
      const { ID } = req.params[0];
      const b = await SELECT.one.from(Bookings, ID);
      if (!b) return req.reject(404, "Bron topilmadi");
      if (b.status === "X")
        return req.reject(400, "Bron allaqachon bekor qilingan");
      const hoursLeft = (Date.parse(b.checkIn) - Date.now()) / 3_600_000;
      if (hoursLeft < 24)
        return req.reject(
          400,
          "Check-in'ga 24 soatdan kam qoldi, bekor qilib bo'lmaydi",
        );
      await UPDATE(Bookings, ID).with({
        status: "X",
        cancelReason: req.data.reason,
      });
      return SELECT.one.from(Bookings, ID);
    });

    // don't delete hotels with active bookings
    this.before("DELETE", Hotels, async (req) => {
      const active = await SELECT.one.from(Bookings)
        .where`room.hotel.ID = ${req.data.ID} and status != 'X' and checkOut >= ${today()}`;
      if (active)
        req.reject(409, "Mehmonxonada faol bronlar bor, o'chirib bo'lmaydi");
    });

    this.on("getExchangeRate", async (req) => {
      const cur = (req.data.currency || "UZS").toUpperCase();
      const rates = await getRates();
      if (!rates[cur]) return req.reject(400, `Noma'lum valyuta: ${cur}`);
      return rates[cur];
    });

    return super.init();
  }
};
