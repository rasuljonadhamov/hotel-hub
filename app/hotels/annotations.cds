using HotelService as service from '../../srv/hotel-service';

annotate service.Hotels with @(
  UI.HeaderInfo: {
    TypeName      : 'Hotel',
    TypeNamePlural: 'Hotels',
    Title         : { Value: name },
    Description   : { Value: city }
  },
  UI.SelectionFields: [ city, stars, isActive ],
  UI.LineItem: [
    { Value: name },
    { Value: city },
    { Value: stars },
    { Value: isActive }
  ],
  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', ID: 'Main',  Label: 'General', Target: '@UI.FieldGroup#Main' },
    { $Type: 'UI.ReferenceFacet', ID: 'Rooms', Label: 'Rooms',   Target: 'rooms/@UI.LineItem' }
  ],
  UI.FieldGroup #Main: { Data: [
    { Value: name }, { Value: city }, { Value: address }, { Value: stars }, { Value: isActive }
  ]}
);

annotate service.Rooms with @(
  UI.HeaderInfo: {
    TypeName      : 'Room',
    TypeNamePlural: 'Rooms',
    Title         : { Value: roomNumber }
  },
  UI.LineItem: [
    { Value: roomNumber },
    { Value: roomType },
    { Value: capacity },
    { Value: pricePerNight }
  ]
);