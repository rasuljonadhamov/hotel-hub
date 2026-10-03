namespace hotel.booking;

using { cuid, managed } from '@sap/cds/common';


entity Hotels : cuid, managed {
  name : String(100) @mandatory;
  city : String(50) @mandatory;
  address : String(200);
  stars : Integer @assert.range: [1, 5];
  isActive : Boolean default true;
  rooms : Composition of many Rooms on rooms.hotel = $self;
}
entity Rooms : cuid {
  hotel : Association to Hotels;
  roomNumber : String(10) @mandatory;
  roomType : String(20) enum { Single; Double; Suite; } default 'Double';
  capacity : Integer @assert.range: [1, 10];
  pricePerNight : Decimal(10,2) @mandatory; // USD
  bookings : Association to many Bookings on bookings.room = $self;
}
entity Customers : cuid, managed {
  firstName : String(50) @mandatory;
  lastName : String(50) @mandatory;
  email : String(100) @mandatory;
  phone : String(20);
  isVip : Boolean default false;
  userId : String(50); // login nomi
  bookings : Association to many Bookings on bookings.customer = $self;
}

@assert.unique: { bookingNo: [bookingNo] }

entity Bookings : cuid, managed {
  bookingNo : Integer @readonly;
  room : Association to Rooms @mandatory;
  customer : Association to Customers @mandatory;
  checkIn : Date @mandatory;
  checkOut : Date @mandatory;
  guests : Integer default 1;
  nights : Integer @readonly;
  totalPrice : Decimal(10,2) @readonly; 
  exchangeRate : Decimal(12,4) @readonly;
  totalPriceUZS : Decimal(15,2) @readonly;
  status : String(1) @readonly enum { New = 'N'; Confirmed = 'C'; Cancelled = 'X'; } default 'N'; 
  cancelReason : String(255);
  notes : String(500);
  virtual statusCriticality : Integer;
}