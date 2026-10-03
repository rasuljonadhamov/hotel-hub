const cds = require('@sap/cds')

const { GET, POST, expect, defaults } = cds.test (__dirname+'/..')
defaults.auth = { username: 'alice', password: '' }

describe('HotelService OData APIs', () => {

  it('serves HotelService.Hotels', async () => {
    const { data } = await GET `/odata/v4/hotel/Hotels ${{ params: { $select: 'ID,name' } }}`
    expect(data.value).to.containSubset([
      // {"ID":"58437210-5d9a-4c54-8acb-3c4c959875a0","name":"name-5843721"},
    ])
  })

  it('executes getExchangeRate', async () => {
    const { data } = await POST `/odata/v4/hotel/getExchangeRate ${
      {}
      // {"currency":"currency-11610787"}
    }`
    // TODO finish this test
    // expect(data.value).to...
  })
})
