# Hygraph Schema Migration: Date + School Access

Run this migration via **Hygraph MCP** (when connected) or add fields manually in Hygraph Studio.

## Changes

1. **School enumeration** – Selectable options in CMS (includes legacy variants; portal maps to canonical keys)
2. **lessonDate** (DATE) – When the lecture was posted
3. **schools** (School[], multi-select) – Which schools can see this lesson
4. **lessonPlan** (STRING, optional) – Raw markdown displayed under the video (lesson plan, curriculum)

---

## School Enum Values (Selectable in CMS)

| Enum Value | Display Name | Portal Groups As |
|------------|--------------|------------------|
| BRONX_MEDICAL | Bronx HS Medical Science | bronx_medical |
| AVIATION | Aviation High School | aviation |
| BUSHWICK | Bushwick High School | bushwick |
| BROOKLYN_LAW | Brooklyn Law | brooklyn_law |
| BK_LAW_TECH | Brooklyn Law / BK Law Tech | brooklyn_law |
| BROOKLYN_LAW_TECH | Brooklyn Law Tech | brooklyn_law |
| QUEENS | Queens (general) | queens |

**Adding a new school:** Add a new enum value in Hygraph (e.g. `NEW_SCHOOL`, "New School Name"), then add it to `hygraph.js` in `ENUM_TO_SCHOOL` and `SCHOOL_TO_ENUMS` (see "Portal Mapping" below).

---

## Via Hygraph MCP

```json
{
  "changes": [
    {
      "operation_name": "createEnumeration",
      "params": {
        "apiId": "School",
        "displayName": "School",
        "description": "Which schools get access to this lesson. Select one or more.",
        "values": [
          {"apiId": "BRONX_MEDICAL", "displayName": "Bronx HS Medical Science"},
          {"apiId": "AVIATION", "displayName": "Aviation High School"},
          {"apiId": "BUSHWICK", "displayName": "Bushwick High School"},
          {"apiId": "BROOKLYN_LAW", "displayName": "Brooklyn Law"},
          {"apiId": "BK_LAW_TECH", "displayName": "Brooklyn Law / BK Law Tech"},
          {"apiId": "BROOKLYN_LAW_TECH", "displayName": "Brooklyn Law Tech"},
          {"apiId": "QUEENS", "displayName": "Queens (general)"}
        ]
      }
    },
    {
      "operation_name": "createSimpleField",
      "params": {
        "apiId": "lessonDate",
        "parentApiId": "MediaItem",
        "type": "DATE",
        "displayName": "Lesson Date",
        "description": "When this lecture was posted / given"
      }
    },
    {
      "operation_name": "createEnumerableField",
      "params": {
        "apiId": "schools",
        "parentApiId": "MediaItem",
        "enumerationApiId": "School",
        "displayName": "Schools",
        "description": "Which schools get access to this lesson",
        "isList": true
      }
    },
    {
      "operation_name": "createSimpleField",
      "params": {
        "apiId": "lessonPlan",
        "parentApiId": "MediaItem",
        "type": "STRING",
        "displayName": "Lesson Plan (Markdown)",
        "description": "Raw markdown content displayed under the video"
      }
    }
  ]
}
```

Run with `dry_run: true` first, then `dry_run: false`.

---

## Via Hygraph Studio (Manual)

1. **Schema** → **Enumerations** → Create `School` with values:
   - BRONX_MEDICAL – Bronx HS Medical Science
   - AVIATION – Aviation High School
   - BUSHWICK – Bushwick High School
   - BROOKLYN_LAW – Brooklyn Law
   - BK_LAW_TECH – Brooklyn Law / BK Law Tech
   - BROOKLYN_LAW_TECH – Brooklyn Law Tech
   - QUEENS – Queens (general)

2. **MediaItem** model → Add fields:
   - `lessonDate` (Date, optional)
   - `schools` (School, multi-select)
   - `lessonPlan` (String, optional) – Raw markdown displayed under the video

3. Publish schema

---

## After Migration: Re-enable Full Query

Once migrated, update `portal/app/lib/hygraph.js`:
- Add `lessonDate` and `schools` to FIELDS
- Use `buildMediaItemsWhere(schoolKey)` and `orderBy: 'lessonDate_DESC'` in `fetchLessons`
- Remove `fetchLessonsWithTags` fallback

---

## Behavior

- **lessonDate**: Sorts lessons newest first; shown on lesson cards.
- **schools**: Lessons appear only for selected schools. Unassigned lessons (empty `schools`) show when viewing “All programs”.

---

## Portal Mapping (hygraph.js)

When adding a new School enum value in Hygraph, update portal/app/lib/hygraph.js:

1. ENUM_TO_SCHOOL – Map enum value → canonical key (for grouping)
2. SCHOOL_TO_ENUMS – Map canonical key → array of enum values (for filtering)
3. LessonsListWithProgress – Add to SCHOOL_LIST and labels if it is a new top-level school

