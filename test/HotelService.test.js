const cds = require("@sap/cds");

const { GET, POST, DELETE, expect } = cds.test(__dirname + "/..");

const S = "/odata/v4/hotel";
const as = (u) => ({ auth: { username: u, password: u } });

// sana: bugundan n kun keyin, 'YYYY-MM-DD'
const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const ROOM_SUITE = "e3234567-89ab-cdef-0123-456789abcdef"; // 350$, 4 kishi
const ROOM_DOUBLE = "e2241477-70e6-4d1e-879f-07e37604b395"; // 180$, 2 kishi
const ROOM_SINGLE = "e1d4b68e-2824-49c6-8f35-961f630018a1"; // 120$, 1 kishi
const CUST_ALI = "c1d4b68e-2824-49c6-8f35-961f630018a1";
const CUST_VALI = "c2241477-70e6-4d1e-879f-07e37604b395"; // VIP

// draft yaratadi va aktivlashtiradi (Fiori'dagi Create + Save)
async function book(user, body) {
  const { data: draft } = await POST(`${S}/Bookings`, body, as(user));
  const { data } = await POST(
    `${S}/Bookings(ID=${draft.ID},IsActiveEntity=false)/HotelService.draftActivate`,
    {},
    as(user),
  );
  return data;
}

// xato statusini qaytaradi (muvaffaqiyat bo'lsa 0)
async function statusOf(promise) {
  try {
    await promise;
    return 0;
  } catch (e) {
    return e.response?.status ?? e.status;
  }
}

describe("HotelService", () => {
  it("login qilmagan foydalanuvchiga 401", async () => {
    expect(await statusOf(GET(`${S}/Hotels`))).to.equal(401);
  });

  it("mehmonxonalarni o'qiydi", async () => {
    const { data } = await GET(`${S}/Hotels?$expand=rooms`, as("ali"));
    expect(data.value.length).to.be.greaterThan(0);
    expect(data.value[0].rooms).to.be.an("array");
  });

  it("Customer faqat o'zining mijoz yozuvini ko'radi", async () => {
    const { data } = await GET(`${S}/Customers`, as("ali"));
    expect(data.value.length).to.equal(1);
    expect(data.value[0].userId).to.equal("ali");
  });

  it("8 tun uchun 10% chegirma (R7)", async () => {
    const b = await book("ali", {
      room_ID: ROOM_SUITE,
      customer_ID: CUST_ALI,
      checkIn: day(60),
      checkOut: day(68),
      guests: 2,
    });
    expect(b.nights).to.equal(8);
    expect(Number(b.totalPrice)).to.equal(2520); // 8 * 350 * 0.9
    expect(b.bookingNo).to.be.greaterThan(1000);
    expect(b.status).to.equal("N");
  });

  it("VIP uchun qo'shimcha 5% (R7)", async () => {
    const b = await book("vali", {
      room_ID: ROOM_DOUBLE,
      customer_ID: CUST_VALI,
      checkIn: day(60),
      checkOut: day(67),
      guests: 2,
    });
    expect(Number(b.totalPrice)).to.equal(1077.3); // 7 * 180 * 0.9 * 0.95
  });

  it("o'tmishdagi check-in rad etiladi (R1)", async () => {
    const s = await statusOf(
      book("ali", {
        room_ID: ROOM_DOUBLE,
        customer_ID: CUST_ALI,
        checkIn: day(-1),
        checkOut: day(2),
        guests: 1,
      }),
    );
    expect(s).to.equal(400);
  });

  it("xona sig'imidan ortiq mehmon rad etiladi (R3)", async () => {
    const s = await statusOf(
      book("ali", {
        room_ID: ROOM_SINGLE,
        customer_ID: CUST_ALI,
        checkIn: day(90),
        checkOut: day(92),
        guests: 3,
      }),
    );
    expect(s).to.equal(400);
  });

  it("band xonaga ikkinchi bron rad etiladi (R5)", async () => {
    const s = await statusOf(
      book("ali", {
        room_ID: ROOM_SUITE,
        customer_ID: CUST_ALI,
        checkIn: day(62),
        checkOut: day(64),
        guests: 1,
      }),
    );
    expect(s).to.equal(409);
  });

  it("boshqa mijoz nomidan bron qilib bo'lmaydi (R6)", async () => {
    const s = await statusOf(
      book("ali", {
        room_ID: ROOM_DOUBLE,
        customer_ID: CUST_VALI,
        checkIn: day(100),
        checkOut: day(102),
        guests: 1,
      }),
    );
    expect(s).to.equal(403);
  });

  it("Customer boshqaning bronini ko'rmaydi", async () => {
    const { data } = await GET(`${S}/Bookings`, as("ali"));
    expect(data.value.every((b) => b.createdBy === "ali")).to.equal(true);
  });

  it("Manager tasdiqlaydi (R9), lekin o'chira olmaydi", async () => {
    const b = await book("ali", {
      room_ID: ROOM_DOUBLE,
      customer_ID: CUST_ALI,
      checkIn: day(120),
      checkOut: day(122),
      guests: 1,
    });
    const key = `Bookings(ID=${b.ID},IsActiveEntity=true)`;
    const { data } = await POST(
      `${S}/${key}/HotelService.confirmBooking`,
      {},
      as("manager"),
    );
    expect(data.status).to.equal("C");
    expect(
      await statusOf(
        POST(`${S}/${key}/HotelService.confirmBooking`, {}, as("manager")),
      ),
    ).to.equal(400);
    expect(await statusOf(DELETE(`${S}/${key}`, as("manager")))).to.equal(403);
  });

  it("Customer bronni tasdiqlay olmaydi", async () => {
    const b = await book("ali", {
      room_ID: ROOM_DOUBLE,
      customer_ID: CUST_ALI,
      checkIn: day(130),
      checkOut: day(132),
      guests: 1,
    });
    const key = `Bookings(ID=${b.ID},IsActiveEntity=true)`;
    expect(
      await statusOf(
        POST(`${S}/${key}/HotelService.confirmBooking`, {}, as("ali")),
      ),
    ).to.equal(403);
  });

  it("valyuta kursini qaytaradi (tashqi API yoki fallback)", async () => {
    const { data } = await GET(
      `${S}/getExchangeRate(currency='UZS')`,
      as("ali"),
    );
    expect(Number(data.value)).to.be.greaterThan(0);
  });
});
