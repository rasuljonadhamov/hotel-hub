using HotelService as service from '../srv/hotel-service';

annotate service.Hotels with {
  ID        @UI.Hidden;
  name      @title: 'Hotel name';
  city      @title: 'City';
  address   @title: 'Address';
  stars     @title: 'Stars';
  isActive  @title: 'Active';
};

annotate service.Rooms with {
  ID            @UI.Hidden;
  hotel         @title: 'Hotel'
                @Common.Text: hotel.name @Common.TextArrangement: #TextOnly;
  roomNumber    @title: 'Room No';
  roomType      @title: 'Room type';
  capacity      @title: 'Capacity';
  pricePerNight @title: 'Price / night' @Measures.ISOCurrency: 'USD';
};

annotate service.Customers with {
  ID        @UI.Hidden;
  firstName @title: 'First name';
  lastName  @title: 'Last name';
  email     @title: 'Email';
  phone     @title: 'Phone';
  isVip     @title: 'VIP';
  userId    @title: 'Login';
};

annotate service.Bookings with {
  ID                @UI.Hidden;
  bookingNo         @title: 'Booking No';
  room              @title: 'Room'
                    @Common.Text: room.roomNumber @Common.TextArrangement: #TextOnly;
  customer          @title: 'Customer'
                    @Common.Text: customer.lastName @Common.TextArrangement: #TextOnly;
  checkIn           @title: 'Check-in';
  checkOut          @title: 'Check-out';
  guests            @title: 'Guests';
  nights            @title: 'Nights';
  totalPrice        @title: 'Total (USD)' @Measures.ISOCurrency: 'USD';
  exchangeRate      @title: 'USD/UZS rate';
  totalPriceUZS     @title: 'Total (UZS)' @Measures.ISOCurrency: 'UZS';
  status            @title: 'Status';
  cancelReason      @title: 'Cancel reason';
  notes             @title: 'Notes' @UI.MultiLineText;
  statusCriticality @UI.Hidden;
};