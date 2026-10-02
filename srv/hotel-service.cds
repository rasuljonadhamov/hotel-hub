using { hotel.booking as db } from '../db/schema';

service HotelService  {
    entity Hotels as projection on db.Hotels;
}