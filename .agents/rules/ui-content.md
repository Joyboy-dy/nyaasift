# User-facing content

This rule is mandatory for every screen, message and email of nyaasift.

## Written for users

- Every text visible to users is written for the user, never for the developer.
- Validation messages, errors, confirmations, toasts, notifications, labels, selects, filters
  and every other UI text are clear, natural, short and free of technical jargon.
- Default language: **French**, unless the project is explicitly in another
  language, the owner says otherwise, or an i18n system defines the language.

## Never shown

Environment variable names, internal keys, technical field names, raw enums, payloads, backend
identifiers, sensitive values and implementation details.

## Errors

An error states the problem directly and, when useful, the expected action: "The phone number
is required", never a variable or property name.

## Values and labels

- Backend values stay distinct from UI labels. Example: `ADMIN` → "Administrator",
  `MEMBER` → "Member", `OWNER` → "Owner" (written in the UI language).
- The same separation applies to statuses, roles, categories, filters, enums, `snake_case`
  values, constants and any value stored or sent by the API.
- The frontend may know the technical value it needs to talk to the backend, but does not
  display it when it is not suited to the user.

## Every change

Check each new or changed frontend text against this rule before handing off.
