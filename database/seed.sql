-- SmartDesk AI - Comprehensive Demonstration Seed Data
-- Passwords are all hashed for 'Password123!' (bcrypt)

-- 1. Insert Categories
INSERT INTO ticket_categories (id, name, description, is_active) VALUES
('c0000000-0000-0000-0000-000000000001', 'Technical Issue', 'Software bugs, crashes, system errors, and API timeouts', true),
('c0000000-0000-0000-0000-000000000002', 'Billing & Payments', 'Invoice inquiries, credit card charges, refunds, and subscriptions', true),
('c0000000-0000-0000-0000-000000000003', 'Account Access', 'Login failures, password resets, 2FA issues, and account lockouts', true),
('c0000000-0000-0000-0000-000000000004', 'Feature Request', 'Suggestions for enhancements, integrations, and workflow additions', true),
('c0000000-0000-0000-0000-000000000005', 'Order & Shipping', 'Physical merchandise delivery, tracking, and returns', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Users (Admin, 3 Agents, 4 Customers)
-- Password: Password123! -> $2b$12$e8YqU0rZg8gqT7U8XqQ8IeXU8zC8b4Vb0k7C5K2l1Z9p4f3L6J7H6 (or standard bcrypt)
INSERT INTO users (id, email, full_name, hashed_password, role, is_active, created_at) VALUES
('u0000000-0000-0000-0000-000000000001', 'admin@smartdesk.ai', 'Eleanor Vance (Admin)', '$2b$12$Z0H7nI1E5p7Qx8j7wW8Yge1dC7sA8h1e4h7o5s8r9t1u2v3w4x5y6', 'admin', true, NOW() - INTERVAL '30 days'),
('u0000000-0000-0000-0000-000000000002', 'sarah.chen@smartdesk.ai', 'Sarah Chen', '$2b$12$Z0H7nI1E5p7Qx8j7wW8Yge1dC7sA8h1e4h7o5s8r9t1u2v3w4x5y6', 'agent', true, NOW() - INTERVAL '25 days'),
('u0000000-0000-0000-0000-000000000003', 'marcus.vance@smartdesk.ai', 'Marcus Vance', '$2b$12$Z0H7nI1E5p7Qx8j7wW8Yge1dC7sA8h1e4h7o5s8r9t1u2v3w4x5y6', 'agent', true, NOW() - INTERVAL '25 days'),
('u0000000-0000-0000-0000-000000000004', 'priya.patel@smartdesk.ai', 'Priya Patel', '$2b$12$Z0H7nI1E5p7Qx8j7wW8Yge1dC7sA8h1e4h7o5s8r9t1u2v3w4x5y6', 'agent', true, NOW() - INTERVAL '20 days'),
('u0000000-0000-0000-0000-000000000005', 'alex.miller@acme.com', 'Alex Miller', '$2b$12$Z0H7nI1E5p7Qx8j7wW8Yge1dC7sA8h1e4h7o5s8r9t1u2v3w4x5y6', 'customer', true, NOW() - INTERVAL '15 days'),
('u0000000-0000-0000-0000-000000000006', 'david.ross@fintech.io', 'David Ross', '$2b$12$Z0H7nI1E5p7Qx8j7wW8Yge1dC7sA8h1e4h7o5s8r9t1u2v3w4x5y6', 'customer', true, NOW() - INTERVAL '14 days'),
('u0000000-0000-0000-0000-000000000007', 'elena.rostova@cloudscale.net', 'Elena Rostova', '$2b$12$Z0H7nI1E5p7Qx8j7wW8Yge1dC7sA8h1e4h7o5s8r9t1u2v3w4x5y6', 'customer', true, NOW() - INTERVAL '10 days'),
('u0000000-0000-0000-0000-000000000008', 'chloe.bennett@retailplus.com', 'Chloe Bennett', '$2b$12$Z0H7nI1E5p7Qx8j7wW8Yge1dC7sA8h1e4h7o5s8r9t1u2v3w4x5y6', 'customer', true, NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- 3. Map Agent Specialties
INSERT INTO agent_categories (agent_id, category_id) VALUES
('u0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001'), -- Sarah: Technical Issue
('u0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004'), -- Sarah: Feature Request
('u0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002'), -- Marcus: Billing & Payments
('u0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005'), -- Marcus: Order & Shipping
('u0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003')  -- Priya: Account Access
ON CONFLICT DO NOTHING;

-- 4. Realistic Support Tickets
INSERT INTO tickets (id, ticket_number, customer_id, title, description, category_id, priority, status, sentiment, urgency_score, assigned_agent_id, created_at, updated_at, first_response_at, resolved_at) VALUES
-- Resolved Tickets
('t0000000-0000-0000-0000-000000000001', 'TICK-1001', 'u0000000-0000-0000-0000-000000000005', 'Unable to login after password reset', 'I received the reset link, set a new password, but getting Error 401 when entering credentials.', 'c0000000-0000-0000-0000-000000000003', 'high', 'resolved', 'Frustrated', 8, 'u0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days 22 hours', NOW() - INTERVAL '4 days 23 hours', NOW() - INTERVAL '4 days 22 hours'),
('t0000000-0000-0000-0000-000000000002', 'TICK-1002', 'u0000000-0000-0000-0000-000000000006', 'Charged twice for Pro annual subscription', 'My credit card statement shows two identical charges of $240 on October 20th. Please refund the duplicate.', 'c0000000-0000-0000-0000-000000000002', 'high', 'resolved', 'Concerned', 7, 'u0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days 20 hours', NOW() - INTERVAL '3 days 23 hours', NOW() - INTERVAL '3 days 20 hours'),
('t0000000-0000-0000-0000-000000000003', 'TICK-1003', 'u0000000-0000-0000-0000-000000000007', 'REST API webhook latency over 5000ms', 'Our event subscriber endpoint is receiving webhook deliveries with severe delays during peak traffic hours.', 'c0000000-0000-0000-0000-000000000001', 'critical', 'resolved', 'Frustrated', 9, 'u0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days 18 hours', NOW() - INTERVAL '3 days 23 hours', NOW() - INTERVAL '3 days 18 hours'),
-- Open Tickets
('t0000000-0000-0000-0000-000000000004', 'TICK-1004', 'u0000000-0000-0000-0000-000000000008', 'Package marked as delivered but not received', 'Tracking number SD-84920 shows delivered to front porch yesterday, but no package arrived.', 'c0000000-0000-0000-0000-000000000005', 'medium', 'open', 'Concerned', 6, 'u0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL, NULL),
('t0000000-0000-0000-0000-000000000005', 'TICK-1005', 'u0000000-0000-0000-0000-000000000005', 'CSV export fails on reports larger than 10k rows', 'When clicking Export to CSV on the quarterly transactions view, the browser tab spins and gives a 504 Gateway Timeout.', 'c0000000-0000-0000-0000-000000000001', 'high', 'in_progress', 'Neutral', 7, 'u0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '20 hours', NULL),
('t0000000-0000-0000-0000-000000000006', 'TICK-1006', 'u0000000-0000-0000-0000-000000000006', 'Need VAT ID updated on historical invoices', 'Our legal entity registered for EU VAT. Need all invoices from Q3 updated with VAT number EU9948271.', 'c0000000-0000-0000-0000-000000000002', 'low', 'open', 'Neutral', 3, 'u0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '14 hours', NOW() - INTERVAL '14 hours', NULL, NULL),
('t0000000-0000-0000-0000-000000000007', 'TICK-1007', 'u0000000-0000-0000-0000-000000000007', 'Request for Dark Mode in customer portal', 'Would love to have an official dark theme option to reduce eye strain when working late shifts.', 'c0000000-0000-0000-0000-000000000004', 'low', 'open', 'Satisfied', 2, 'u0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours', NULL, NULL),
('t0000000-0000-0000-0000-000000000008', 'TICK-1008', 'u0000000-0000-0000-0000-000000000008', '2FA Authenticator phone lost - need backup bypass', 'My device was damaged in water and I do not have access to my Google Authenticator app for my login.', 'c0000000-0000-0000-0000-000000000003', 'critical', 'in_progress', 'Urgent', 9, 'u0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '4 hours', NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. AI Analyses for Seed Tickets
INSERT INTO ticket_ai_analyses (id, ticket_id, predicted_category, urgency_score, suggested_priority, predicted_sentiment, summary, suggested_solutions, suggested_response, confidence, reasoning, status) VALUES
('a0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001', 'Account Access', 8, 'high', 'Frustrated', 'Customer is unable to sign in following a password reset process with 401 error.', '["Verify session token invalidation", "Clear stale browser cookies or incognito test", "Trigger manual password reset link via admin portal"]'::jsonb, 'Hello Alex, I apologize for the trouble accessing your account. Let us get your password sync verified right away.', 0.92, 'Authentication lockout prevents customer from utilizing paid features.', 'completed'),
('a0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000002', 'Billing & Payments', 7, 'high', 'Concerned', 'Customer was duplicate-charged $240 for an annual Pro subscription on credit card.', '["Locate transaction IDs in Stripe dashboard", "Issue refund for the duplicate transaction", "Ensure recurring subscription is only attached once"]'::jsonb, 'Hi David, thank you for bringing this to our attention. We have identified the duplicate charge and processed your full refund.', 0.95, 'Financial discrepancy requiring immediate billing reversal.', 'completed'),
('a0000000-0000-0000-0000-000000000003', 't0000000-0000-0000-0000-000000000003', 'Technical Issue', 9, 'critical', 'Frustrated', 'Webhook latency exceeding 5000ms SLA, affecting enterprise customer integrations.', '["Check webhook worker queue backlog", "Scale background dispatch worker pods", "Inspect network egress bottlenecks"]'::jsonb, 'Hello Elena, our infrastructure team is investigating the delivery queue delays and deploying extra processing workers.', 0.89, 'High latency impacting production client services.', 'completed')
ON CONFLICT (ticket_id) DO NOTHING;
