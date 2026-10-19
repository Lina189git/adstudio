// Canned messages admins can pick from when writing to an influencer on a task
// thread. Keeping these centralized makes it easy to tweak copy without
// touching the UI component.

export type MessageTemplate = {
  label: string;
  body: string;
};

export const ADMIN_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    label: "Sample delivered — time to film",
    body: "Hi! Our tracking shows your sample has arrived. Whenever you're ready, go ahead and film your video and submit it here — we can't wait to see it!",
  },
  {
    label: "Reminder to submit video",
    body: "Just a friendly reminder — we haven't received your video submission yet. Could you share an update on timing? Let us know if you need anything from us.",
  },
  {
    label: "Deadline approaching",
    body: "Quick heads up: your task deadline is coming up soon. Please submit your video as soon as you can so we have time to review it before then.",
  },
  {
    label: "Please follow the brief closely",
    body: "Thanks for submitting! Before we approve, please make sure your video covers everything in the task brief and requirements checklist, then resubmit.",
  },
  {
    label: "Revision requested",
    body: "Thanks for the submission! We'd love a couple of tweaks before we can approve it — see the notes on your video, then upload a revised version here.",
  },
  {
    label: "Video approved",
    body: "Great news — your video has been approved! Your commission is now being processed. Thank you for the great work.",
  },
  {
    label: "Request shipping address",
    body: "To send your sample, could you confirm your shipping address is up to date on your influencer profile? Let us know once it's set.",
  },
  {
    label: "General check-in",
    body: "Hi! Just checking in on how things are going with this task. Let us know if you have any questions or need anything from our side.",
  },
];
