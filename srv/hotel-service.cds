using { hotel.booking as db } from '../db/schema';

service HotelService  {
    entity Hotels as projection on db.Hotels;
    entity Rooms as projection on db.Rooms;
    entity Bookings as projection on db.Bookings
}