using { hotel.booking as db } from '../db/schema';

service HotelService @(requires: 'authenticated-user') {

    //hotels
    @odata.draft.enabled
    @restrict: [
    { grant: 'READ', to: ['Customer', 'Manager'] },
    { grant: '*', to: 'Admin' }
    ]
    entity Hotels as projection on db.Hotels;

    //rooms
    @restrict: [
        { grant: 'READ', to: ['Customer', 'Manager'] },
        { grant: '*', to: 'Admin' }
    ]
    entity Rooms as projection on db.Rooms;

    //costumers
    @restrict: [
        { grant: 'READ', to: 'Customer', where: 'userId = $user' },
        { grant: ['READ', 'CREATE', 'UPDATE'], to: 'Manager' },
        { grant: '*', to: 'Admin' }
    ]
    entity Customers as projection on db.Customers;

    //booking
    @odata.draft.enabled
    @restrict: [
        { grant: 'CREATE', to: 'Customer' },
        { grant: ['READ', 'UPDATE', 'cancelBooking'], to: 'Customer', where: 'createdBy = $user' },
        { grant: ['READ', 'CREATE', 'UPDATE', 'confirmBooking', 'cancelBooking'], to: 'Manager' },
        { grant: '*', to: 'Admin' }
    ]
    entity Bookings as projection on db.Bookings actions {

    //func
    action confirmBooking() returns Bookings;
    action cancelBooking(reason: String) returns Bookings;
    };
    function getExchangeRate(currency: String) returns Decimal(15,4);
}