Found this on official docs page https://docs.attio.com/rest-api/endpoint-reference/entries/create-an-entry-add-record-to-list

this is the view I want to add prospects to
https://app.attio.com/jaco-frontend-dev/custom/graftbot/view/e79a1dd1-8554-4f6a-a8f9-70ee8a5ffa7e


### List Entries

| Record ID | Record | Created at | Prospect Source | URL Type | Created by |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 649024f0-a619-471c-a2b3-3674d517577a | 649024f0-a619-471c-a2b3-3674d517577a | 2026-04-02T11:24:49Z | inbound | https://drainco.co.za/durbanville/ | Plumbing | Jacob Kotzee |

```js
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    data: {
      parent_record_id: '891dcbfc-9141-415d-9b2a-2238a6cc012d',
      parent_object: 'people',
      entry_values: {
        '41252299-f8c7-4b5e-99c9-4ff8321d2f96': 'Text value',
        multiselect_attribute: ['Select option 1', 'Select option 2']
      }
    }
  })
};


fetch('https://api.attio.com/v2/lists/{list}/entries', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));
```
