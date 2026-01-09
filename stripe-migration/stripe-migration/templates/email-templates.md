# Email Templates for Stripe Migration

## Template 1: Free Plan Users

**Subject:** Important: Your [App Name] Account is Being Updated

---

Dear {{customer_name}},

We're writing to inform you about an important update to your [App Name] account.

### What's happening?
We're upgrading our payment infrastructure to provide you with better service and security. As part of this upgrade, we're migrating to a new payment processing system.

### What do you need to do?
Since you're on our free plan, **no action is required from you**. Your account will continue to work seamlessly.

### When is this happening?
The migration will take place on **{{migration_date}}**. You may notice a brief service interruption during this time.

### Questions?
If you have any questions, please contact our support team at {{support_email}}.

Thank you for being a valued customer!

Best regards,  
The [App Name] Team

---

## Template 2: Paid Plan Users - Initial Notification

**Subject:** Action Required: Update Your Payment Method for [App Name]

---

Dear {{customer_name}},

We're writing to inform you about an important update that **requires your attention**.

### What's happening?
We're upgrading our payment infrastructure to provide you with better service and security. As part of this upgrade, we need you to re-authorize your payment method.

### What do you need to do?
1. Click the link below to securely update your payment information
2. Enter your payment details (we use industry-standard encryption)
3. Confirm your subscription

**[Update Payment Method]({{payment_update_url}})**

### When do you need to do this?
Please update your payment method by **{{deadline_date}}** to ensure uninterrupted service.

### Your subscription details:
- **Current Plan:** {{plan_name}}
- **Billing Amount:** {{amount}} {{currency}}
- **Billing Frequency:** {{interval}}
- **Next Billing Date:** {{next_billing_date}}

**Important:** Your plan and pricing will remain exactly the same.

### Questions?
If you have any questions or concerns, please contact our support team at {{support_email}}.

Thank you for your cooperation!

Best regards,  
The [App Name] Team

---

## Template 3: First Reminder (1 Week After)

**Subject:** Reminder: Update Your Payment Method for [App Name]

---

Dear {{customer_name}},

This is a friendly reminder to update your payment method for your [App Name] subscription.

### Action Required
We noticed you haven't updated your payment information yet. To avoid any interruption to your service, please update your payment method as soon as possible.

**[Update Payment Method Now]({{payment_update_url}})**

### Your subscription details:
- **Plan:** {{plan_name}}
- **Amount:** {{amount}} {{currency}}/{{interval}}
- **Next Billing Date:** {{next_billing_date}}

### Why is this necessary?
We're upgrading to a more secure payment system. For security reasons, we cannot transfer payment information between systems, so we need you to re-enter your payment details.

### Need help?
Contact our support team at {{support_email}} - we're here to help!

Best regards,  
The [App Name] Team

---

## Template 4: Final Reminder (2 Weeks After)

**Subject:** Urgent: Action Required to Continue Your [App Name] Subscription

---

Dear {{customer_name}},

**This is your final reminder** to update your payment method for your [App Name] subscription.

### ⚠️ Action Required Immediately
Your subscription will be paused after **{{deadline_date}}** if you don't update your payment method.

**[Update Payment Method Now]({{payment_update_url}})**

### What happens if I don't update?
- Your subscription will be paused on {{deadline_date}}
- You'll lose access to premium features
- Your data will be safe, but you won't be able to use paid features

### Current subscription:
- **Plan:** {{plan_name}}
- **Amount:** {{amount}} {{currency}}/{{interval}}

### Having trouble?
If you're experiencing any issues or have questions, please contact us immediately at {{support_email}} or call {{support_phone}}.

We value your business and want to ensure you maintain uninterrupted service.

Best regards,  
The [App Name] Team

---

## Template 5: Success Confirmation

**Subject:** ✅ Payment Method Updated Successfully

---

Dear {{customer_name}},

Great news! Your payment method has been successfully updated.

### What's next?
Nothing! Your subscription will continue as normal:

- **Plan:** {{plan_name}}
- **Amount:** {{amount}} {{currency}}/{{interval}}
- **Next Billing Date:** {{next_billing_date}}

Your service will continue uninterrupted, and you'll be charged on your regular billing cycle.

### Thank you!
We appreciate your prompt action in updating your payment information. This helps us provide you with the best possible service.

If you have any questions, feel free to contact us at {{support_email}}.

Best regards,  
The [App Name] Team

---

## Template 6: Migration Announcement (2 Weeks Before)

**Subject:** Important Update: [App Name] Payment System Upgrade

---

Dear {{customer_name}},

We're excited to announce an important upgrade to our payment infrastructure!

### What's changing?
Over the next few weeks, we'll be migrating to a new, more secure payment processing system. This upgrade will provide:

- ✅ Enhanced security for your payment information
- ✅ Faster payment processing
- ✅ Better reliability and uptime
- ✅ Support for additional payment methods (coming soon)

### What you need to know:
- **For Free Plan Users:** No action required
- **For Paid Plan Users:** You'll receive an email with instructions to re-authorize your payment method

### Timeline:
- **{{announcement_date}}:** Initial announcement (today)
- **{{migration_start_date}}:** Migration begins
- **{{migration_end_date}}:** Migration completes

### Your subscription won't change:
- Same plan
- Same pricing
- Same features
- Same billing cycle

### Questions?
We've prepared a detailed FAQ at {{faq_url}}. If you have additional questions, contact us at {{support_email}}.

Thank you for being a valued [App Name] customer!

Best regards,  
The [App Name] Team

---

## Variable Reference

Use these variables in your email templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{customer_name}}` | Customer's name | "John Doe" |
| `{{customer_email}}` | Customer's email | "john@example.com" |
| `{{plan_name}}` | Subscription plan name | "Pro Plan" |
| `{{amount}}` | Billing amount | "$29.99" |
| `{{currency}}` | Currency code | "USD" |
| `{{interval}}` | Billing interval | "month" or "year" |
| `{{next_billing_date}}` | Next billing date | "February 15, 2026" |
| `{{payment_update_url}}` | Unique payment update link | "https://checkout.stripe.com/..." |
| `{{migration_date}}` | Migration date | "January 20, 2026" |
| `{{deadline_date}}` | Deadline for action | "January 30, 2026" |
| `{{support_email}}` | Support email address | "support@yourapp.com" |
| `{{support_phone}}` | Support phone number | "+1-555-0123" |
| `{{faq_url}}` | FAQ page URL | "https://yourapp.com/migration-faq" |

---

## Email Sending Schedule

### Week 1: Announcement
- Send Template 6 to all customers

### Week 2: Migration Start
- Send Template 1 to free plan users
- Send Template 2 to paid plan users

### Week 3: First Reminder
- Send Template 3 to paid users who haven't updated

### Week 4: Final Reminder
- Send Template 4 to paid users who still haven't updated

### Ongoing: Success Confirmations
- Send Template 5 immediately after payment method is updated
