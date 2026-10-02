namespace hotel.booking;

using { cuid, managed } from '@sap/cds/common';

entity Hotels : cuid, managed {
    name : String(100);
    city : String(50);
    address : String(200);
    stars : Integer @assert.range: [1, 5];
    isActive : Boolean;
}