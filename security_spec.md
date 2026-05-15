# Security Specification - Stash

## Data Invariants
1. A saved item must belong to a valid authenticated user (`ownerId` matches `auth.uid`).
2. Users can only read/write their own items.
3. Timestamps (`createdAt`, `updatedAt`) must be server-validated.
4. Categories must belong to the user who created them or are global (if we decide). For now, per-user.
5. IDs must be valid strings.

## The Dirty Dozen Payloads
1. **The Identity Thief**: Create an item with someone else's `ownerId`.
2. **The Time Traveler**: Set a custom `createdAt` in the past.
3. **The Ghost Writer**: Write an item without being logged in.
4. **The Snoop**: Read another user's item by guessing its ID.
5. **The Resource Hog**: Inject a 1MB string into the `title`.
6. **The Category Hijack**: Assign an item to a category ID that doesn't exist or belongs to someone else.
7. **The Update Gap**: Update only the `ownerId` of an existing item.
8. **The Shadow Field**: Add `isAdmin: true` to a user profile (if we had one) or item.
9. **The ID Poisoning**: Use a document ID that is a 2KB string of junk characters.
10. **The Null Attack**: Set `title` to `null`.
11. **The Type Confusion**: Set `tags` to a string instead of an array.
12. **The Global Wipe**: Attempt to delete all documents in a collection.

## The Test Runner
A `firestore.rules.test.ts` would verify these, but since I can't run it here easily, I will focus on the rules implementation.
