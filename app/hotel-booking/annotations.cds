using HotelService as service from '../../srv/hotel-service';

// value help
annotate service.Bookings with {
  room @Common.ValueList: {
    Label         : 'Rooms',
    CollectionPath: 'Rooms',
    Parameters    : [
      { $Type: 'Common.ValueListParameterInOut',       LocalDataProperty: room_ID, ValueListProperty: 'ID' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'roomNumber' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'hotel_ID' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'roomType' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'capacity' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'pricePerNight' }
    ]
  };
  customer @Common.ValueList: {
    Label         : 'Customers',
    CollectionPath: 'Customers',
    Parameters    : [
      { $Type: 'Common.ValueListParameterInOut',       LocalDataProperty: customer_ID, ValueListProperty: 'ID' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'lastName' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'firstName' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'email' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'isVip' }
    ]
  };
};

// list report + object page
annotate service.Bookings with @(
  UI.HeaderInfo: {
    TypeName      : 'Booking',
    TypeNamePlural: 'Bookings',
    Title         : { Value: bookingNo },
    Description   : { Value: room.hotel.name }
  },

  UI.SelectionFields: [ status, checkIn, room_ID, customer_ID ],

  UI.LineItem: [
    { Value: bookingNo },
    { Value: customer.lastName, Label: 'Customer' },
    { Value: room.hotel.name,   Label: 'Hotel' },
    { Value: room.roomNumber,   Label: 'Room' },
    { Value: checkIn },
    { Value: checkOut },
    { Value: nights },
    { Value: totalPrice },
    { Value: status, Criticality: statusCriticality },
    { $Type: 'UI.DataFieldForAction', Action: 'HotelService.confirmBooking', Label: 'Confirm' },
    { $Type: 'UI.DataFieldForAction', Action: 'HotelService.cancelBooking',  Label: 'Cancel' }
  ],

  // Object Page sarlavhasidagi KPI'lar
  UI.HeaderFacets: [
    { $Type: 'UI.ReferenceFacet', Target: '@UI.DataPoint#Total' },
    { $Type: 'UI.ReferenceFacet', Target: '@UI.DataPoint#Status' }
  ],
  UI.DataPoint #Total : { Value: totalPrice, Title: 'Total (USD)' },
  UI.DataPoint #Status: { Value: status, Title: 'Status', Criticality: statusCriticality },

  // Object Page tepasidagi tugmalar
  UI.Identification: [
    { $Type: 'UI.DataFieldForAction', Action: 'HotelService.confirmBooking', Label: 'Confirm' },
    { $Type: 'UI.DataFieldForAction', Action: 'HotelService.cancelBooking',  Label: 'Cancel' }
  ],

  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', ID: 'Details', Label: 'Booking Details', Target: '@UI.FieldGroup#Details' },
    { $Type: 'UI.ReferenceFacet', ID: 'Price',   Label: 'Price',           Target: '@UI.FieldGroup#Price' },
    { $Type: 'UI.ReferenceFacet', ID: 'Admin',   Label: 'Administrative',  Target: '@UI.FieldGroup#Admin' }
  ],

  UI.FieldGroup #Details: { Data: [
    { Value: customer_ID }, { Value: room_ID },
    { Value: checkIn }, { Value: checkOut },
    { Value: guests }, { Value: notes }
  ]},
  UI.FieldGroup #Price: { Data: [
    { Value: nights }, { Value: totalPrice }, { Value: exchangeRate }, { Value: totalPriceUZS },
    { Value: status, Criticality: statusCriticality }, { Value: cancelReason }
  ]},
  UI.FieldGroup #Admin: { Data: [
    { Value: createdBy }, { Value: createdAt }, { Value: modifiedBy }, { Value: modifiedAt }
  ]}
);

// buttons active only in matching state
annotate service.Bookings with actions {
  confirmBooking @Core.OperationAvailable: { $edmJson: { $Eq: [ { $Path: 'in/status' }, 'N' ] } };
  cancelBooking  @Core.OperationAvailable: { $edmJson: { $Ne: [ { $Path: 'in/status' }, 'X' ] } };
};

// parameter name for the cancel dialog
annotate service.Bookings with actions {
  cancelBooking(reason @title: 'Cancel reason' @UI.MultiLineText);
};

// recompute price fields when date/room/guest changes
annotate service.Bookings with @Common.SideEffects #Price: {
  SourceProperties: [ checkIn, checkOut, room_ID, guests ],
  TargetProperties: [ 'nights', 'totalPrice', 'exchangeRate', 'totalPriceUZS' ]
};