# QUOATATION FORM SCHEMAS

## Form 1 — Cat 5 & 35 (DC & Registered Mandate)

```json
{
  "form": {
    "title": "StratCol EFT Debit Order – Addendum to Contract (Cat 5 & 35)",
    "fields": [
      {
        "name": "master_id",
        "label": "Master ID (Office Use)",
        "type": "text",
        "required": false,
        "placeholder": "Enter Master ID",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "user_id",
        "label": "User ID (Office Use)",
        "type": "text",
        "required": false,
        "placeholder": "Enter User ID",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "quotation_date",
        "label": "Quotation Date",
        "type": "date",
        "required": true,
        "placeholder": "",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "registered_name_surname",
        "label": "Registered Name / Surname",
        "type": "text",
        "required": true,
        "placeholder": "Enter registered name or surname",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "trading_name",
        "label": "Trading Name",
        "type": "text",
        "required": false,
        "placeholder": "Enter trading name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "registration_or_id_number",
        "label": "Reg. No. / ID No.",
        "type": "text",
        "required": true,
        "placeholder": "Enter registration or ID number",
        "defaultValue": "",
        "validation": {
          "min": null,
          "max": null,
          "pattern": "^[A-Za-z0-9/]+$",
          "message": "Enter a valid registration or ID number"
        },
        "options": []
      },
      {
        "name": "person_accepting_quotation",
        "label": "Person Accepting Quotation on Behalf of User",
        "type": "text",
        "required": true,
        "placeholder": "Full name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "designation",
        "label": "Designation",
        "type": "text",
        "required": true,
        "placeholder": "e.g. Director, Manager",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "telephone",
        "label": "Telephone",
        "type": "tel",
        "required": true,
        "placeholder": "+27 XX XXX XXXX",
        "defaultValue": "",
        "validation": {
          "min": null,
          "max": null,
          "pattern": "^[0-9+\\-\\s()]{7,20}$",
          "message": "Enter a valid telephone number"
        },
        "options": []
      },
      {
        "name": "email",
        "label": "E-mail",
        "type": "email",
        "required": true,
        "placeholder": "user@example.com",
        "defaultValue": "",
        "validation": {
          "min": null,
          "max": null,
          "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
          "message": "Enter a valid email address"
        },
        "options": []
      },
      {
        "name": "cat5_facility_approved",
        "label": "CAT 5 (EFT) – Non Insurance: Facility Approved?",
        "type": "select",
        "required": true,
        "placeholder": "Select Y or N",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select Yes or No" },
        "options": [
          { "label": "Yes", "value": "Y" },
          { "label": "No", "value": "N" }
        ]
      },
      {
        "name": "cat35_facility_approved",
        "label": "CAT 35 (EFT) – Insurance: Facility Approved?",
        "type": "select",
        "required": true,
        "placeholder": "Select Y or N",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select Yes or No" },
        "options": [
          { "label": "Yes", "value": "Y" },
          { "label": "No", "value": "N" }
        ]
      },
      {
        "name": "joining_fee",
        "label": "Joining Fee (Once-off, excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "695",
        "defaultValue": 695,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "annual_license_fee",
        "label": "Annual License Fee (Payable after 3 months, excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "410",
        "defaultValue": 410,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "monthly_admin_fee",
        "label": "Monthly Admin Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "410",
        "defaultValue": 410,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "per_transaction_fee",
        "label": "Per Transaction Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "3.44",
        "defaultValue": 3.44,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "per_transaction_fee_late",
        "label": "Late Transaction Fee – submitted until 24:00 on day before action day (R)",
        "type": "number",
        "required": false,
        "placeholder": "0.51",
        "defaultValue": 0.51,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "per_unpaid_disputed_fee",
        "label": "Per Unpaid / Disputed Transaction Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "17.60",
        "defaultValue": 17.6,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "per_unpaid_disputed_fee_same_day",
        "label": "Same Day Transaction Fee – submitted until 12:00 on action day (R)",
        "type": "number",
        "required": false,
        "placeholder": "1.07",
        "defaultValue": 1.07,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "per_payment_to_user_fee",
        "label": "Per Payment to User Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "4.86",
        "defaultValue": 4.86,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "bulk_sms_fee",
        "label": "Bulk SMS Service per SMS – Optional (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "0.29",
        "defaultValue": 0.29,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "ahv_bulk_fee",
        "label": "AHV – Per Transaction Bulk (2 hours) (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "3.29",
        "defaultValue": 3.29,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "ahv_single_fee",
        "label": "AHV – Per Transaction Single Real-Time (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "5.19",
        "defaultValue": 5.19,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "idvr_fee",
        "label": "IDVR – IDV Real-Time Query to DHA (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "12",
        "defaultValue": 12,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "idvc_fee",
        "label": "IDVC – IDV Cache from Verified Service Provider (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "2",
        "defaultValue": 2,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "ra_fee",
        "label": "RA – Real-Time Address Data Query to DHA (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "1.50",
        "defaultValue": 1.5,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "max_transactions_per_month",
        "label": "Maximum Number of Transactions per Month",
        "type": "number",
        "required": true,
        "placeholder": "Enter max transaction count",
        "defaultValue": "",
        "validation": { "min": 1, "max": null, "pattern": null, "message": "Must be at least 1" },
        "options": []
      },
      {
        "name": "max_rand_value_per_month",
        "label": "Maximum Rand Value of All Transactions per Month (R)",
        "type": "number",
        "required": true,
        "placeholder": "Enter maximum monthly Rand value",
        "defaultValue": "",
        "validation": { "min": 1, "max": null, "pattern": null, "message": "Must be a positive amount" },
        "options": []
      },
      {
        "name": "line_limit",
        "label": "Highest Single Transaction – Line Limit (R)",
        "type": "number",
        "required": true,
        "placeholder": "Enter line limit amount",
        "defaultValue": "",
        "validation": { "min": 1, "max": null, "pattern": null, "message": "Must be a positive amount" },
        "options": []
      },
      {
        "name": "abbreviated_reference",
        "label": "Abbreviated Reference (max 10 characters)",
        "type": "text",
        "required": true,
        "placeholder": "Max 10 chars",
        "defaultValue": "",
        "validation": {
          "min": null,
          "max": 10,
          "pattern": "^.{1,10}$",
          "message": "Reference must be 10 characters or fewer"
        },
        "options": []
      },
      {
        "name": "security_retention_percentage",
        "label": "Security Retention – % of Monthly Collected Funds (Option A)",
        "type": "number",
        "required": false,
        "placeholder": "e.g. 5",
        "defaultValue": "",
        "validation": { "min": 0, "max": 100, "pattern": null, "message": "Enter a percentage between 0 and 100" },
        "options": []
      },
      {
        "name": "security_option",
        "label": "User Accepts Security Option",
        "type": "select",
        "required": true,
        "placeholder": "Select A or B",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select a security option" },
        "options": [
          { "label": "A – StratCol Retains % of Collected Funds", "value": "A" },
          { "label": "B – Up Front Electronic Transfer", "value": "B" }
        ]
      },
      {
        "name": "acceptance_signature",
        "label": "Accepted (Signature / Name for User)",
        "type": "text",
        "required": true,
        "placeholder": "Authorised signatory name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "acceptance_date",
        "label": "Date of Acceptance",
        "type": "date",
        "required": true,
        "placeholder": "",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      }
    ]
  }
}
```

---

**Notes on the extraction:**

| Decision | Reasoning |
| --- | --- |
| Fee fields set as **read-only defaults** | Values like `695`, `3.44`, `17.6` etc. are pre-filled by StratCol — mark them `readOnly: true` in your Next.js component if they shouldn't be edited by users |
| `cat5_facility_approved` / `cat35_facility_approved` | Cells E25 and M25 show `Y/N` — mapped as `select` dropdowns |
| `security_option` | "User accepts A or B" → `select` with two explicit options |
| `abbreviated_reference` | Cell J45 notes max 10 characters → `max: 10` validation applied |
| Fee description columns (I34, I35, etc.) | Treated as labels/notes, not separate fields |

## Form 2 - "StratCol Quotation – DC & Registered Mandate (Cat 8 & 38)"

```json
{
  "form": {
    "title": "StratCol Quotation – DC & Registered Mandate (Cat 8 & 38)",
    "fields": [
      {
        "name": "master_id",
        "label": "Master ID (Office Use)",
        "type": "text",
        "required": false,
        "placeholder": "Enter Master ID",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "user_id",
        "label": "User ID (Office Use)",
        "type": "text",
        "required": false,
        "placeholder": "Enter User ID",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "quotation_date",
        "label": "Quotation Date",
        "type": "date",
        "required": true,
        "placeholder": "",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "registered_name_surname",
        "label": "Registered Name / Surname",
        "type": "text",
        "required": true,
        "placeholder": "Enter registered name or surname",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "trading_name",
        "label": "Trading Name",
        "type": "text",
        "required": false,
        "placeholder": "Enter trading name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "registration_or_id_number",
        "label": "Reg. No. / ID No.",
        "type": "text",
        "required": true,
        "placeholder": "Enter registration or ID number",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[A-Za-z0-9/]+$", "message": "Enter a valid registration or ID number" },
        "options": []
      },
      {
        "name": "person_accepting_quotation",
        "label": "Person Accepting Quotation on Behalf of User",
        "type": "text",
        "required": true,
        "placeholder": "Full name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "designation",
        "label": "Designation",
        "type": "text",
        "required": true,
        "placeholder": "e.g. Director, Manager",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "telephone",
        "label": "Telephone",
        "type": "tel",
        "required": true,
        "placeholder": "+27 XX XXX XXXX",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[0-9+\\-\\s()]{7,20}$", "message": "Enter a valid telephone number" },
        "options": []
      },
      {
        "name": "email",
        "label": "E-mail",
        "type": "email",
        "required": true,
        "placeholder": "user@example.com",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", "message": "Enter a valid email address" },
        "options": []
      },
      {
        "name": "cat8_facility_approved",
        "label": "CAT 8 (EFT) – Non Insurance: Facility Approved?",
        "type": "select",
        "required": true,
        "placeholder": "Select Y or N",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select Yes or No" },
        "options": [
          { "label": "Yes", "value": "Y" },
          { "label": "No", "value": "N" }
        ]
      },
      {
        "name": "cat38_facility_approved",
        "label": "CAT 38 (EFT) – Insurance: Facility Approved?",
        "type": "select",
        "required": true,
        "placeholder": "Select Y or N",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select Yes or No" },
        "options": [
          { "label": "Yes", "value": "Y" },
          { "label": "No", "value": "N" }
        ]
      },
      {
        "name": "joining_fee",
        "label": "Joining Fee (Once-off, excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "695",
        "defaultValue": 695,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "annual_license_fee",
        "label": "Annual License Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "410",
        "defaultValue": 410,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "monthly_admin_fee",
        "label": "Monthly Admin Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "410",
        "defaultValue": 410,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "mobile_app_monthly_fee",
        "label": "Mobile App Monthly Fee per Download – DebiCheck TT3 (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "50",
        "defaultValue": 50,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "dc_tt1_mandate_successful",
        "label": "DebiCheck TT1 – Mandate Initiation Successful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "8.03",
        "defaultValue": 8.03,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "dc_tt1_mandate_unsuccessful",
        "label": "DebiCheck TT1 – Mandate Initiation Unsuccessful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "4.18",
        "defaultValue": 4.18,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "dc_tt1_mandate_no_response",
        "label": "DebiCheck TT1 – Mandate Initiation No Response (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "4.08",
        "defaultValue": 4.08,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "dc_tt1_mandate_amendment_successful",
        "label": "DebiCheck TT1 – Mandate Amendment with Re-auth Successful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "8.03",
        "defaultValue": 8.03,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "dc_tt2_mandate_successful",
        "label": "DebiCheck TT2 – Mandate Initiation Successful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "7.26",
        "defaultValue": 7.26,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "dc_tt2_mandate_unsuccessful",
        "label": "DebiCheck TT2 – Mandate Initiation Unsuccessful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "3.03",
        "defaultValue": 3.03,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "dc_tt2_mandate_no_response",
        "label": "DebiCheck TT2 – Mandate Initiation No Response (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "3.50",
        "defaultValue": 3.5,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "dc_tt2_mandate_amendment_successful",
        "label": "DebiCheck TT2 – Mandate Amendment with Re-auth Successful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "5.27",
        "defaultValue": 5.27,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "dc_tt3_mandate_successful",
        "label": "DebiCheck TT3 – Mandate Initiation Successful (Card Tap App) (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "6.49",
        "defaultValue": 6.49,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "dc_tt3_mandate_amendment_successful",
        "label": "DebiCheck TT3 – Mandate Amendment with Re-auth Successful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "6.49",
        "defaultValue": 6.49,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "mobi_auth_tt3_soft_pos",
        "label": "Mobi AUTH TT3 Soft POS Transaction Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "3.61",
        "defaultValue": 3.61,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "mandate_info_request_fee",
        "label": "Mandate Information Request (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "1.11",
        "defaultValue": 1.11,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "mandate_cancellation_fee",
        "label": "Mandate Cancellation (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "1.11",
        "defaultValue": 1.11,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "collection_successful_fee",
        "label": "Collection Successful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "8.17",
        "defaultValue": 8.17,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "collection_unsuccessful_fee",
        "label": "Collection Unsuccessful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "5.89",
        "defaultValue": 5.89,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "dispute_notification_fee",
        "label": "Dispute Notification (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "19.96",
        "defaultValue": 19.96,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "rm_mandate_initiation_successful",
        "label": "RM – Mandate Initiation Successful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "4.82",
        "defaultValue": 4.82,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "rm_mandate_initiation_unsuccessful",
        "label": "RM – Mandate Initiation Unsuccessful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "3.58",
        "defaultValue": 3.58,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "rm_collection_successful",
        "label": "RM – Collection Successful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "3.85",
        "defaultValue": 3.85,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "rm_collection_unsuccessful",
        "label": "RM – Collection Unsuccessful (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "4.00",
        "defaultValue": 4.0,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "bulk_sms_fee",
        "label": "Bulk SMS per SMS – Optional (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "0.29",
        "defaultValue": 0.29,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "ahv_bulk_fee",
        "label": "AHV – Per Transaction Bulk (2 hours) (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "3.29",
        "defaultValue": 3.29,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "ahv_single_fee",
        "label": "AHV – Per Transaction Single Real-Time (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "5.19",
        "defaultValue": 5.19,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "idvr_fee",
        "label": "IDVR – IDV Real-Time Query to DHA (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "12",
        "defaultValue": 12,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "idvc_fee",
        "label": "IDVC – IDV Cache from Verified Service Provider (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "2",
        "defaultValue": 2,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "ra_fee",
        "label": "RA – Real-Time Address Data Query to DHA (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "1.50",
        "defaultValue": 1.5,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "idvp_fee",
        "label": "IDVP – IDV Real-Time + Vitality + Marital Status (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "12",
        "defaultValue": 12,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "max_transactions_per_month",
        "label": "Maximum Number of Transactions per Month",
        "type": "number",
        "required": true,
        "placeholder": "Enter max transaction count",
        "defaultValue": "",
        "validation": { "min": 1, "max": null, "pattern": null, "message": "Must be at least 1" },
        "options": []
      },
      {
        "name": "max_rand_value_per_month",
        "label": "Maximum Rand Value of All Transactions per Month (R)",
        "type": "number",
        "required": true,
        "placeholder": "Enter maximum monthly Rand value",
        "defaultValue": "",
        "validation": { "min": 1, "max": null, "pattern": null, "message": "Must be a positive amount" },
        "options": []
      },
      {
        "name": "line_limit",
        "label": "Highest Single Transaction – Line Limit (R)",
        "type": "number",
        "required": true,
        "placeholder": "Enter line limit amount",
        "defaultValue": "",
        "validation": { "min": 1, "max": null, "pattern": null, "message": "Must be a positive amount" },
        "options": []
      },
      {
        "name": "abbreviated_reference",
        "label": "Abbreviated Reference (max 10 characters)",
        "type": "text",
        "required": true,
        "placeholder": "Max 10 chars",
        "defaultValue": "",
        "validation": { "min": null, "max": 10, "pattern": "^.{1,10}$", "message": "Reference must be 10 characters or fewer" },
        "options": []
      },
      {
        "name": "security_retention_percentage",
        "label": "Security Retention – % of Monthly Collected Funds (Option A)",
        "type": "number",
        "required": false,
        "placeholder": "10",
        "defaultValue": 10,
        "validation": { "min": 0, "max": 100, "pattern": null, "message": "Enter a percentage between 0 and 100" },
        "options": []
      },
      {
        "name": "security_option",
        "label": "User Accepts Security Option",
        "type": "select",
        "required": true,
        "placeholder": "Select A or B",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select a security option" },
        "options": [
          { "label": "A – StratCol Retains % of Collected Funds", "value": "A" },
          { "label": "B – Up Front Electronic Transfer", "value": "B" }
        ]
      },
      {
        "name": "acceptance_signature",
        "label": "Accepted (Signature / Name for User)",
        "type": "text",
        "required": true,
        "placeholder": "Authorised signatory name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "acceptance_date",
        "label": "Date of Acceptance",
        "type": "date",
        "required": true,
        "placeholder": "",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      }
    ]
  }
}
```

---

## Form 3 — Cat 60 & 63 Credit Card

```json
{
  "form": {
    "title": "StratCol Quotation – Credit/Debit Card Payments (Cat 60 & 63)",
    "fields": [
      {
        "name": "master_id",
        "label": "Master ID (Office Use)",
        "type": "text",
        "required": false,
        "placeholder": "Enter Master ID",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "user_id",
        "label": "User ID (Office Use)",
        "type": "text",
        "required": false,
        "placeholder": "Enter User ID",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "quotation_date",
        "label": "Quotation Date",
        "type": "date",
        "required": true,
        "placeholder": "",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "registered_name_surname",
        "label": "Registered Name / Surname",
        "type": "text",
        "required": true,
        "placeholder": "Enter registered name or surname",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "trading_name",
        "label": "Trading Name",
        "type": "text",
        "required": false,
        "placeholder": "Enter trading name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "registration_or_id_number",
        "label": "Reg. No. / ID No.",
        "type": "text",
        "required": true,
        "placeholder": "Enter registration or ID number",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[A-Za-z0-9/]+$", "message": "Enter a valid registration or ID number" },
        "options": []
      },
      {
        "name": "person_accepting_quotation",
        "label": "Person Accepting Quotation on Behalf of User",
        "type": "text",
        "required": true,
        "placeholder": "Full name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "designation",
        "label": "Designation",
        "type": "text",
        "required": true,
        "placeholder": "e.g. Director, Manager",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "telephone",
        "label": "Telephone",
        "type": "tel",
        "required": true,
        "placeholder": "+27 XX XXX XXXX",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[0-9+\\-\\s()]{7,20}$", "message": "Enter a valid telephone number" },
        "options": []
      },
      {
        "name": "email",
        "label": "E-mail",
        "type": "email",
        "required": true,
        "placeholder": "user@example.com",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", "message": "Enter a valid email address" },
        "options": []
      },
      {
        "name": "cat60_facility_approved",
        "label": "CAT 60 – Non Insurance: Facility Approved?",
        "type": "select",
        "required": true,
        "placeholder": "Select Y or N",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select Yes or No" },
        "options": [
          { "label": "Yes", "value": "Y" },
          { "label": "No", "value": "N" }
        ]
      },
      {
        "name": "cat63_facility_approved",
        "label": "CAT 63 – Insurance: Facility Approved?",
        "type": "select",
        "required": true,
        "placeholder": "Select Y or N",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select Yes or No" },
        "options": [
          { "label": "Yes", "value": "Y" },
          { "label": "No", "value": "N" }
        ]
      },
      {
        "name": "joining_fee",
        "label": "Joining Fee (Once-off, excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "695",
        "defaultValue": 695,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "annual_license_fee",
        "label": "Annual License Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "410",
        "defaultValue": 410,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "monthly_admin_fee",
        "label": "Monthly Admin Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "410",
        "defaultValue": 410,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "per_transaction_fee",
        "label": "Per Transaction Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "3.44",
        "defaultValue": 3.44,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "per_payment_to_user_fee",
        "label": "Per Payment to User Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "4.86",
        "defaultValue": 4.86,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "credit_card_transaction_percentage",
        "label": "Credit Card Transaction % (excl. VAT)",
        "type": "number",
        "required": false,
        "placeholder": "0.03",
        "defaultValue": 0.03,
        "validation": { "min": 0, "max": 100, "pattern": null, "message": "Enter a valid percentage" },
        "options": []
      },
      {
        "name": "bulk_sms_fee",
        "label": "Bulk SMS per SMS – Optional (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "0.29",
        "defaultValue": 0.29,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "idvr_fee",
        "label": "IDVR – IDV Real-Time Query to DHA (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "12",
        "defaultValue": 12,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "idvc_fee",
        "label": "IDVC – IDV Cache from Verified Service Provider (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "2",
        "defaultValue": 2,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "ra_fee",
        "label": "RA – Real-Time Address Data Query to DHA (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "1.50",
        "defaultValue": 1.5,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "idvp_fee",
        "label": "IDVP – IDV Real-Time + Vitality + Marital Status (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "12",
        "defaultValue": 12,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "security_amount_required",
        "label": "Security Amount Required (R)",
        "type": "number",
        "required": true,
        "placeholder": "Enter security amount",
        "defaultValue": "",
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive amount" },
        "options": []
      },
      {
        "name": "acceptance_signature",
        "label": "Accepted (Signature / Name for User)",
        "type": "text",
        "required": true,
        "placeholder": "Authorised signatory name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "acceptance_date",
        "label": "Date of Acceptance",
        "type": "date",
        "required": true,
        "placeholder": "",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      }
    ]
  }
}
```

---

## Form 4 — Cat 60 & 63 Retailer Payment (Pay@)

```json
{
  "form": {
    "title": "StratCol Quotation – Pay@ Retailer Payments (Cat 60 & 63)",
    "fields": [
      {
        "name": "master_id",
        "label": "Master ID (Office Use)",
        "type": "text",
        "required": false,
        "placeholder": "Enter Master ID",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "user_id",
        "label": "User ID (Office Use)",
        "type": "text",
        "required": false,
        "placeholder": "Enter User ID",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "quotation_date",
        "label": "Quotation Date",
        "type": "date",
        "required": true,
        "placeholder": "",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "registered_name_surname",
        "label": "Registered Name / Surname",
        "type": "text",
        "required": true,
        "placeholder": "Enter registered name or surname",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "trading_name",
        "label": "Trading Name",
        "type": "text",
        "required": false,
        "placeholder": "Enter trading name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "registration_or_id_number",
        "label": "Reg. No. / ID No.",
        "type": "text",
        "required": true,
        "placeholder": "Enter registration or ID number",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[A-Za-z0-9/]+$", "message": "Enter a valid registration or ID number" },
        "options": []
      },
      {
        "name": "person_accepting_quotation",
        "label": "Person Accepting Quotation on Behalf of User",
        "type": "text",
        "required": true,
        "placeholder": "Full name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "designation",
        "label": "Designation",
        "type": "text",
        "required": true,
        "placeholder": "e.g. Director, Manager",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "telephone",
        "label": "Telephone",
        "type": "tel",
        "required": true,
        "placeholder": "+27 XX XXX XXXX",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[0-9+\\-\\s()]{7,20}$", "message": "Enter a valid telephone number" },
        "options": []
      },
      {
        "name": "email",
        "label": "E-mail",
        "type": "email",
        "required": true,
        "placeholder": "user@example.com",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", "message": "Enter a valid email address" },
        "options": []
      },
      {
        "name": "cat60_facility_approved",
        "label": "CAT 60 – Non Insurance: Facility Approved?",
        "type": "select",
        "required": true,
        "placeholder": "Select Y or N",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select Yes or No" },
        "options": [
          { "label": "Yes", "value": "Y" },
          { "label": "No", "value": "N" }
        ]
      },
      {
        "name": "cat63_facility_approved",
        "label": "CAT 63 – Insurance: Facility Approved?",
        "type": "select",
        "required": true,
        "placeholder": "Select Y or N",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select Yes or No" },
        "options": [
          { "label": "Yes", "value": "Y" },
          { "label": "No", "value": "N" }
        ]
      },
      {
        "name": "joining_fee",
        "label": "Joining Fee (Once-off, excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "695",
        "defaultValue": 695,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "annual_license_fee",
        "label": "Annual License Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "410",
        "defaultValue": 410,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "monthly_admin_fee",
        "label": "Monthly Admin Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "410",
        "defaultValue": 410,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "per_transaction_fee",
        "label": "Per Transaction Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "9.07",
        "defaultValue": 9.07,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "per_payment_to_user_fee",
        "label": "Per Payment to User Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "4.86",
        "defaultValue": 4.86,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "sms_fee",
        "label": "SMS Service per SMS (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "0.26",
        "defaultValue": 0.26,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "retailer_handling_fee_cash_eft_wallet",
        "label": "Retailer Handling Fee – Cash / EFT / Wallet (% per transaction)",
        "type": "number",
        "required": false,
        "placeholder": "0.70%",
        "defaultValue": 0.007,
        "validation": { "min": 0, "max": 100, "pattern": null, "message": "Enter a valid percentage" },
        "options": []
      },
      {
        "name": "retailer_handling_fee_debit_card",
        "label": "Retailer Handling Fee – Debit Card (% per transaction)",
        "type": "number",
        "required": false,
        "placeholder": "1.34%",
        "defaultValue": 0.0134,
        "validation": { "min": 0, "max": 100, "pattern": null, "message": "Enter a valid percentage" },
        "options": []
      },
      {
        "name": "retailer_handling_fee_credit_card",
        "label": "Retailer Handling Fee – Credit Card (% per transaction)",
        "type": "number",
        "required": false,
        "placeholder": "2.11%",
        "defaultValue": 0.0211,
        "validation": { "min": 0, "max": 100, "pattern": null, "message": "Enter a valid percentage" },
        "options": []
      },
      {
        "name": "brs_company_name",
        "label": "Business Requirement – Name of Company (on retailer receipt)",
        "type": "text",
        "required": true,
        "placeholder": "Company name as it appears on receipt",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "brs_call_centre_tel",
        "label": "Business Requirement – Call Centre Tel No.",
        "type": "tel",
        "required": false,
        "placeholder": "+27 XX XXX XXXX",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[0-9+\\-\\s()]{7,20}$", "message": "Enter a valid telephone number" },
        "options": []
      },
      {
        "name": "minimum_amount",
        "label": "Minimum Payment Amount (R)",
        "type": "number",
        "required": false,
        "placeholder": "Enter minimum amount",
        "defaultValue": "",
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "maximum_amount",
        "label": "Maximum Payment Amount (R) – max R5,000 (R3,000 at PEP)",
        "type": "number",
        "required": false,
        "placeholder": "Enter maximum amount",
        "defaultValue": "",
        "validation": { "min": 0, "max": 5000, "pattern": null, "message": "Maximum allowed is R5,000" },
        "options": []
      },
      {
        "name": "payment_option",
        "label": "Payment Option",
        "type": "select",
        "required": true,
        "placeholder": "Select payment option",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select a payment option" },
        "options": [
          { "label": "Partial Payment", "value": "partial" },
          { "label": "Exact Payment", "value": "exact" },
          { "label": "Multiple Payments (Multiple of Exact Amount)", "value": "multiple" }
        ]
      },
      {
        "name": "payment_value",
        "label": "Payment Value (R)",
        "type": "number",
        "required": false,
        "placeholder": "Enter payment value",
        "defaultValue": "",
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "payment_rule",
        "label": "Payment Rule",
        "type": "textarea",
        "required": false,
        "placeholder": "Describe applicable payment rule",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "transaction_days",
        "label": "Transaction Days (Retailer Business Days)",
        "type": "text",
        "required": false,
        "placeholder": "e.g. Mon–Fri",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "transaction_frequency",
        "label": "Transaction Frequency",
        "type": "select",
        "required": false,
        "placeholder": "Select frequency",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": [
          { "label": "Once-off", "value": "once_off" },
          { "label": "Recurring", "value": "recurring" }
        ]
      },
      {
        "name": "security_amount_required",
        "label": "Security Amount Required (R)",
        "type": "number",
        "required": true,
        "placeholder": "Enter security amount",
        "defaultValue": "",
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive amount" },
        "options": []
      },
      {
        "name": "acceptance_signature",
        "label": "Accepted (Signature / Name for User)",
        "type": "text",
        "required": true,
        "placeholder": "Authorised signatory name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "acceptance_date",
        "label": "Date of Acceptance",
        "type": "date",
        "required": true,
        "placeholder": "",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      }
    ]
  }
}
```

---

## Form 5 — Cat 16 & 36 PaySharp (3rd Party Payments)

```json
{
  "form": {
    "title": "StratCol Quotation – 3rd Party Payments / PayShap (Cat 16 & 36)",
    "fields": [
      {
        "name": "master_id",
        "label": "Master ID (Office Use)",
        "type": "text",
        "required": false,
        "placeholder": "Enter Master ID",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "user_id",
        "label": "User ID (Office Use)",
        "type": "text",
        "required": false,
        "placeholder": "Enter User ID",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "quotation_date",
        "label": "Quotation Date",
        "type": "date",
        "required": true,
        "placeholder": "",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "registered_name_surname",
        "label": "Registered Name / Surname",
        "type": "text",
        "required": true,
        "placeholder": "Enter registered name or surname",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "trading_name",
        "label": "Trading Name",
        "type": "text",
        "required": false,
        "placeholder": "Enter trading name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "registration_or_id_number",
        "label": "Reg. No. / ID No.",
        "type": "text",
        "required": true,
        "placeholder": "Enter registration or ID number",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[A-Za-z0-9/]+$", "message": "Enter a valid registration or ID number" },
        "options": []
      },
      {
        "name": "person_accepting_quotation",
        "label": "Person Accepting Quotation on Behalf of User",
        "type": "text",
        "required": true,
        "placeholder": "Full name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "designation",
        "label": "Designation",
        "type": "text",
        "required": true,
        "placeholder": "e.g. Director, Manager",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "telephone",
        "label": "Telephone",
        "type": "tel",
        "required": true,
        "placeholder": "+27 XX XXX XXXX",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[0-9+\\-\\s()]{7,20}$", "message": "Enter a valid telephone number" },
        "options": []
      },
      {
        "name": "email",
        "label": "E-mail",
        "type": "email",
        "required": true,
        "placeholder": "user@example.com",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", "message": "Enter a valid email address" },
        "options": []
      },
      {
        "name": "cat16_facility_approved",
        "label": "CAT 16 – Non Insurance: Facility Approved?",
        "type": "select",
        "required": true,
        "placeholder": "Select Y or N",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select Yes or No" },
        "options": [
          { "label": "Yes", "value": "Y" },
          { "label": "No", "value": "N" }
        ]
      },
      {
        "name": "cat36_facility_approved",
        "label": "CAT 36 – Insurance: Facility Approved?",
        "type": "select",
        "required": true,
        "placeholder": "Select Y or N",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": "Please select Yes or No" },
        "options": [
          { "label": "Yes", "value": "Y" },
          { "label": "No", "value": "N" }
        ]
      },
      {
        "name": "joining_fee",
        "label": "Joining Fee (Once-off, excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "695",
        "defaultValue": 695,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "annual_license_fee",
        "label": "Annual License Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "410",
        "defaultValue": 410,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "monthly_admin_fee",
        "label": "Monthly Admin Fee (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "410",
        "defaultValue": 410,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "eft_payment_absa_same_day",
        "label": "Per EFT Payment – ABSA Same Day (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "3.28",
        "defaultValue": 3.28,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "eft_payment_real_time_non_absa",
        "label": "Per EFT Real Time Payment – Non-ABSA Banks (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "27.50",
        "defaultValue": 27.5,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "payshap_payment_under_10000",
        "label": "Per PayShap Payment – Less than R10,000 (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "2.50",
        "defaultValue": 2.5,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "payshap_payment_over_10000",
        "label": "Per PayShap Payment – R10,000 or More (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "12.50",
        "defaultValue": 12.5,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "bulk_sms_fee",
        "label": "Bulk SMS per SMS – Optional (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "0.29",
        "defaultValue": 0.29,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "ahv_bulk_fee",
        "label": "AHV – Per Transaction Bulk (2 hours) (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "3.29",
        "defaultValue": 3.29,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "ahv_single_fee",
        "label": "AHV – Per Transaction Single Real-Time (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "5.19",
        "defaultValue": 5.19,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "idvr_fee",
        "label": "IDVR – IDV Real-Time Query to DHA (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "12",
        "defaultValue": 12,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "idvc_fee",
        "label": "IDVC – IDV Cache from Verified Service Provider (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "2",
        "defaultValue": 2,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "ra_fee",
        "label": "RA – Real-Time Address Data Query to DHA (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "1.50",
        "defaultValue": 1.5,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "idvp_fee",
        "label": "IDVP – IDV Real-Time + Vitality + Marital Status (excl. VAT) (R)",
        "type": "number",
        "required": false,
        "placeholder": "12",
        "defaultValue": 12,
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive number" },
        "options": []
      },
      {
        "name": "max_transactions_per_month",
        "label": "Maximum Number of Transactions per Month",
        "type": "number",
        "required": true,
        "placeholder": "Enter max transaction count",
        "defaultValue": "",
        "validation": { "min": 1, "max": null, "pattern": null, "message": "Must be at least 1" },
        "options": []
      },
      {
        "name": "max_rand_value_per_month",
        "label": "Maximum Rand Value of All Transactions per Month (R)",
        "type": "number",
        "required": true,
        "placeholder": "Enter maximum monthly Rand value",
        "defaultValue": "",
        "validation": { "min": 1, "max": null, "pattern": null, "message": "Must be a positive amount" },
        "options": []
      },
      {
        "name": "line_limit",
        "label": "Highest Single Transaction – Line Limit (R)",
        "type": "number",
        "required": true,
        "placeholder": "Enter line limit amount",
        "defaultValue": "",
        "validation": { "min": 1, "max": null, "pattern": null, "message": "Must be a positive amount" },
        "options": []
      },
      {
        "name": "abbreviated_reference",
        "label": "Abbreviated Reference (max 10 characters)",
        "type": "text",
        "required": true,
        "placeholder": "Max 10 chars",
        "defaultValue": "",
        "validation": { "min": null, "max": 10, "pattern": "^.{1,10}$", "message": "Reference must be 10 characters or fewer" },
        "options": []
      },
      {
        "name": "security_amount_required",
        "label": "Security Amount Required (R)",
        "type": "number",
        "required": true,
        "placeholder": "Enter security amount",
        "defaultValue": "",
        "validation": { "min": 0, "max": null, "pattern": null, "message": "Must be a positive amount" },
        "options": []
      },
      {
        "name": "acceptance_signature",
        "label": "Accepted (Signature / Name for User)",
        "type": "text",
        "required": true,
        "placeholder": "Authorised signatory name",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      },
      {
        "name": "acceptance_date",
        "label": "Date of Acceptance",
        "type": "date",
        "required": true,
        "placeholder": "",
        "defaultValue": "",
        "validation": { "min": null, "max": null, "pattern": null, "message": null },
        "options": []
      }
    ]
  }
}
```

---

**Summary of all 5 forms extracted:**

| Form | Sheet | Unique fields |
|---|---|---|
| **Cat 5 & 35** | EFT Debit Order | Security % retention option A/B |
| **Cat 8 & 38** | DC & Registered Mandate | 20+ DebiCheck TT1/TT2/TT3 + RM fee fields |
| **Cat 60 & 63 Credit Card** | Credit/Debit Card | Credit card transaction %, security amount |
| **Cat 60 & 63 Retailer** | Pay@ Retailer | BRS receipt info, payment options, retailer handling fees |
| **Cat 16 & 36 PaySharp** | 3rd Party / PayShap | ABSA same-day, real-time non-ABSA, PayShap tiers |

All fee fields carry their pre-filled `defaultValue` from the spreadsheet and can be marked `readOnly: true` in your Next.js components if they shouldn't be editable by end users.
