# UI/UX Wireframes — Jolu Group ERP

## Design System

- **Primary Color:** Jolu Green (#16a34a)
- **Sidebar:** Dark slate (#0f172a)
- **Typography:** Inter (Google Fonts)
- **Components:** Tailwind CSS utility classes with custom component layer
- **Icons:** Lucide React

---

## 1. Login Screen

```
┌─────────────────────────────────────────────────────────────┐
│                    [Dark Green Gradient BG]                  │
│                                                              │
│              ┌──────────────────────────┐                   │
│              │     [Jolu Logo Icon]      │                   │
│              │     Jolu Group ERP        │                   │
│              │  Enterprise Resource Plan  │                   │
│              └──────────────────────────┘                   │
│                                                              │
│         ┌────────────────────────────────┐                  │
│         │  Email Address    [________]   │                  │
│         │  Password         [________]   │                  │
│         │  2FA Code         [______]     │  (conditional)   │
│         │                                │                  │
│         │     [    Sign In Button    ]   │                  │
│         └────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Main Layout

```
┌──────────┬──────────────────────────────────────────────────┐
│ SIDEBAR  │  PAGE HEADER                                     │
│          │  Title + Subtitle              [Action Buttons]  │
│ [Logo]   ├──────────────────────────────────────────────────┤
│          │                                                  │
│ Company  │  PAGE CONTENT                                    │
│ Selector │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│ ▼        │  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │           │
│          │  └──────┘ └──────┘ └──────┘ └──────┘           │
│ ──────── │                                                  │
│ Dashboard│  ┌─────────────────────────────────────────┐    │
│ Group    │  │         Charts / Tables / Cards          │    │
│ CRM      │  │                                          │    │
│ Pipeline │  └─────────────────────────────────────────┘    │
│ Inventory│                                                  │
│ Invoices │                                                  │
│ ...      │                                                  │
│          │                                                  │
│ ──────── │                                                  │
│ [User]   │                                                  │
│ Sign Out │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

---

## 3. Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard — Real-time business overview                      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│ │Monthly  │ │Outstand.│ │Active   │ │Open     │ │Low     ││
│ │Revenue  │ │Invoices │ │Leads    │ │Tickets  │ │Stock   ││
│ │KES 2.4M │ │KES 890K │ │   24    │ │   8     │ │   3    ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘│
│                                                              │
│ ┌──────────────────────┐  ┌──────────────────────┐         │
│ │ Revenue Trend Chart  │  │ Low Stock Alerts     │         │
│ │ [Line Chart 6 mo]    │  │ • Oil Filter (8)     │         │
│ │                      │  │ • Air Filter (5)     │         │
│ └──────────────────────┘  └──────────────────────┘         │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Outstanding Invoices Table                            │   │
│ │ INV-2026-000001 | Peter Kamau | KES 450,000 | OVERDUE│   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Sales Pipeline (Kanban)

```
┌─────────────────────────────────────────────────────────────┐
│ Sales Pipeline                                               │
├─────────────────────────────────────────────────────────────┤
│ [Monthly: 12] [Quarterly: 34] [Annual: 89] [Conv: 42%]    │
│                                                              │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────┐ ┌────┐│
│ │New     │ │Qualif. │ │Proposal│ │Bank    │ │Won │ │Lost││
│ │Lead (5)│ │ (8)    │ │ (4)    │ │ (3)    │ │(2) │ │(1) ││
│ │┌──────┐│ │┌──────┐│ │┌──────┐│ │┌──────┐│ │    │ │    ││
│ ││Card 1││ ││Card  ││ ││Card  ││ ││Card  ││ │    │ │    ││
│ │└──────┘│ │└──────┘│ │└──────┘│ │└──────┘│ │    │ │    ││
│ │┌──────┐│ │        │ │        │ │        │ │    │ │    ││
│ ││Card 2││ │        │ │        │ │        │ │    │ │    ││
│ │└──────┘│ │        │ │        │ │        │ │    │ │    ││
│ └────────┘ └────────┘ └────────┘ └────────┘ └────┘ └────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Customer Profile

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back    Peter Kamau                    [Edit] [New Invoice] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌─────────────────────────────────┐  │
│ │ Personal Info   │  │ Financial Info                   │  │
│ │ ID: 12345678    │  │ Bank: KCB                        │  │
│ │ KRA: A001234567B│  │ Loan: KES 2,800,000             │  │
│ │ Phone: +2547... │  │ Deposit: KES 500,000            │  │
│ │ County: Nairobi │  │ Status: PENDING                  │  │
│ └─────────────────┘  └─────────────────────────────────┘  │
│                                                              │
│ [Activities] [Documents] [Invoices] [Service] [Financing]   │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Jun 15 — CALL — Follow-up on financing application    │   │
│ │ Jun 10 — MEETING — Site visit at customer farm        │   │
│ │ Jun 5  — NOTE — Customer interested in MF 375         │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Accounting Reports

```
┌─────────────────────────────────────────────────────────────┐
│ Accounting                                                   │
│ [CoA] [Journals] [Trial Balance] [P&L] [Balance Sheet] [AR] │
├─────────────────────────────────────────────────────────────┤
│ Income Statement — Jan 1 to Jun 16, 2026                    │
│ ┌─────────────────────┐  ┌─────────────────────┐         │
│ │ REVENUE             │  │ EXPENSES             │         │
│ │ Sales    KES 5.2M   │  │ COGS     KES 3.1M   │         │
│ │ Service  KES 890K   │  │ OpEx     KES 450K   │         │
│ │ ─────────────────   │  │ ─────────────────   │         │
│ │ Total    KES 6.09M  │  │ Net Income KES 2.5M │         │
│ └─────────────────────┘  └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior

- **Desktop (1280px+):** Full sidebar + multi-column layouts
- **Tablet (768px):** Collapsible sidebar, 2-column grids
- **Mobile (375px):** Bottom navigation, single column, stacked Kanban (horizontal scroll)

## Accessibility

- WCAG 2.1 AA color contrast ratios
- Keyboard navigation for all interactive elements
- Screen reader labels on form inputs
- Focus indicators on all focusable elements
