import { deepStrictEqual } from 'assert';
import { createTrigger, TriggerStrategy } from '@activepieces/framework';
import { airtableCommon } from '../common';
import { AirtableRecord } from '../common/models';

const triggerNameInStore = 'airtable_new_record_trigger';
export const airtableNewRecord = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is added to the selected table.',
  props: {
    authentication: airtableCommon.authentication,
    base: airtableCommon.base,
    table: airtableCommon.table
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    const {authentication: personalToken, base: baseId, table} = context.propsValue
    const currentTableSnapshot = await airtableCommon.getTableSnapshot({
      tableId: table.id,
      personalToken,
      baseId
    })

    await context.store?.put<AirtableRecord[]>(triggerNameInStore, currentTableSnapshot);
  },

  async onDisable(context) {
    await context.store.put<undefined>(triggerNameInStore, undefined);
  },
  
  async run(context) {
    const {authentication: personalToken, base: baseId, table} = context.propsValue
    const currentTableSnapshot = await airtableCommon.getTableSnapshot({
      tableId: table.id,
      personalToken,
      baseId
    });
    
    const lastSnapshot = await context.store.get<AirtableRecord[]>(triggerNameInStore) || [];
    const payloads = currentTableSnapshot.filter(r => !lastSnapshot.find(or => {
      try {
        deepStrictEqual(r, or);
        return true;
      }
      catch (err) {
        return false;
      }
    }));

    await context.store?.put<AirtableRecord[]>(triggerNameInStore, currentTableSnapshot);
    return payloads;
  },
});
