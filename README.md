# Proofolio

## Faculty branch assignments

Faculty student access, mentoring, and certificate review are restricted to the branch stored on each `FacultyProfile`. New faculty registrations are not assigned a branch automatically. Existing profiles without a branch remain unassigned and cannot view student certificates or review submissions.

An administrator should open **Admin Dashboard → Faculty Directory** and assign the correct branch to each faculty member. The directory supports clearing an assignment; an unassigned faculty member remains unable to review certificates until the administrator configures it again. Do not infer assignments from the department field or bulk-assign branches without verifying the faculty records.

No database migration or data backfill is required: the optional `branch` field is added to the Mongoose profile schema and is written when an administrator makes an explicit assignment. Existing records are left unchanged.
