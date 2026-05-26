# Security Specification: FlowDash Credit Central (NoSQL)

## 1. Data Invariants
- **Branches**: Only designated branch administrators or authorized managers may create or modify physical branch registries.
- **Users**: Users can view all authorized officer records to facilitate operations. Only security admins can update user role tiers or security permissions.
- **Financial Records**: Records must be linked to a physical branch. Write access is restricted to verified employees.
- **Duties & Tasks**: Tasks are assigned to specific employee emails. Assignees can progress task completion, but only creators ('assignedBy') can delete them.
- **Communications**: Broadcast messages can be read by all authenticated workers of the firm.
- **Audit Logs**: Read access is restricted to core safety auditors or admins. Write access is permitted to capture operational actions under zero trust.

## 2. Dirty Dozen Malicious Payloads Checked
1. **Unsigned-In Write**: Attempting to add a new branch without being signed in.
2. **Identity Spoofing**: Registering a user profile with dynamic role escalation (`role: "Admin"`) from the client direct SDK.
3. **Privilege Escalation**: Standard officer modifying their own roles and system permissions.
4. **Orphaned Transactions**: Creating a financial record without referencing an active branch name.
5. **Denial of Wallet (Huge Payload)**: Inserting records with excessive long strings (e.g. name of length 1MB) to deplete quota.
6. **Cross-User Hijacking**: Standard user updating or deleting task items created by another manager.
7. **Bypassing Terminal States**: Attempting to revert a "Completed" task or completed financial ledger entry.
8. **Client Timestamp Forgery**: Creating audit logs with artificial timestamps indicating a historic date.
9. **PII Leaks**: Attempting to fetch private client contact items (email/phone) as an external system auditor who does not own the profile.
10. **Malicious ID Char Injection**: Specifying dynamic path symbols containing SQL injection like symbols (`../`) or wildcards.
11. **Negative Asset Balance Manipulation**: Logging financial disbursement amount as negative.
12. **Blind Query Search**: Harvesting all customer accounts without target branch restriction (List Scraping).

## 3. Test Cases Draft Verification
Standard simulation test runs ensure all previous Dirty Dozen payloads result in `PERMISSION_DENIED`.
