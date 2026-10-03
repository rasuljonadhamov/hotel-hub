namespace hotel.booking;

using { cuid, managed } from '@sap/cds/common';

entity Hotels : cuid, managed {
    name : String(100);
    city : String(50);
    address : String(200);
    stars : Integer @assert.range: [1, 5];
    isActive : Boolean;
    rooms: Composition of many Rooms on rooms.hotel = $self
}

entity Rooms: cuid, managed {
  hotel: Association to Hotels;
  roomNumber    : String(10) @mandatory;
  type          : String(20) enum { Single; Double; Suite };
  capacity      : Integer default 2;
  pricePerNight : Decimal(10, 2) @mandatory;
  currency      : String(3) default 'USD';
  isActive      : Boolean default true;
}

entity Bookings : cuid, managed {
  bookingNo    : Integer @readonly;
  room         : Association to Rooms @mandatory;
  guestName    : String(100) @mandatory;
  guestEmail   : String(100);
  guests       : Integer default 1;
  checkIn      : Date @mandatory;
  checkOut     : Date @mandatory;
  nights       : Integer @readonly;
  totalPrice   : Decimal(12, 2) @readonly;
  currency     : String(3) @readonly;
  totalInUZS   : Decimal(15, 0) @readonly;
  status       : String enum {
                    New       = 'N';
                    Confirmed = 'C';
                    Cancelled = 'X';
                }
}