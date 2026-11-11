import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const hook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.2,
  config: {
    name: 'Portal Submit',
    parameters: {
      httpMethod: 'POST',
      path: 'hilton-guest-stays/submit',
      responseMode: 'onReceived',
      options: {
        responseData: '{"ok":true,"message":"Guest saved"}',
      },
    },
  },
});

const save = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Save Guest Stay',
    parameters: {
      resource: 'row',
      operation: 'insert',
      dataTableId: {
        __rl: true,
        mode: 'id',
        value: 'bHpQ8dQAJ4RxqikX',
        cachedResultName: 'Hilton Guest Stays',
      },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          GuestName: expr('={{ $json.body.guestName }}'),
          RoomNumber: expr('={{ $json.body.roomNumber }}'),
          Food: expr('={{ $json.body.food }}'),
          NumberOfGuests: expr('={{ Number($json.body.numberOfGuests) }}'),
          CheckinDate: expr('={{ $json.body.checkInDate.toString().slice(0, 10) + "T12:00:00.000Z" }}'),
          CheckoutDate: expr('={{ $json.body.checkOutDate.toString().slice(0, 10) + "T12:00:00.000Z" }}'),
          Code: expr('={{ $json.body.code }}'),
        },
        schema: [
          { id: 'GuestName', displayName: 'GuestName', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'RoomNumber', displayName: 'RoomNumber', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Food', displayName: 'Food', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'NumberOfGuests', displayName: 'NumberOfGuests', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
          { id: 'CheckinDate', displayName: 'CheckinDate', required: false, defaultMatch: false, display: true, type: 'date', canBeUsedToMatch: true },
          { id: 'CheckoutDate', displayName: 'CheckoutDate', required: false, defaultMatch: false, display: true, type: 'date', canBeUsedToMatch: true },
          { id: 'Code', displayName: 'Code', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
        ],
      },
    },
  },
});

export default workflow('hilton-portal-submit', 'Hilton Portal Submit')
  .add(hook)
  .to(save);
