# Pattern: Modals & Sheets

## BottomSheet

From `components/ui/BottomSheet.tsx`. Used for contextual actions, folder pickers, confirmations on mobile.

```tsx
<BottomSheet open={open} onClose={() => setOpen(false)} title="Choose folder">
  {/* Scrollable content */}
</BottomSheet>
```

Structure:
- Backdrop: `bg-black/40 backdrop-blur-sm`, click to close
- Sheet: slides up from bottom with Framer Motion (`y: "100%" → 0`)
- Drag handle: `h-1 w-10 rounded-full bg-[var(--color-border)]` centered top
- Title bar: title left, × button right
- Content: `overflow-y-auto pb-tab-bar px-4`
- Max height: `max-h-[90dvh]`

## Dialog

From `components/ui/dialog.tsx`. Used for confirmations, destructive actions.

```tsx
<Dialog>
  <DialogContent>
    <DialogHeader><h2>Delete account?</h2></DialogHeader>
    <p>This action cannot be undone.</p>
    <DialogFooter>
      <Button variant="secondary">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Delete Confirmation Pattern

Two-stage: tap delete → confirm in dialog. Never delete on first tap.

```tsx
const [showConfirm, setShowConfirm] = useState(false)
const [deleting, setDeleting] = useState(false)

// Step 1: trigger
<Button variant="destructive" onClick={() => setShowConfirm(true)}>
  Delete
</Button>

// Step 2: confirm dialog
{showConfirm && (
  <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
    <DialogContent>
      <DialogHeader><h2>Delete this entry?</h2></DialogHeader>
      <p className="text-sm text-[var(--color-text-secondary)]">
        This can't be undone.
      </p>
      <DialogFooter>
        <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
        <Button variant="destructive" loading={deleting} onClick={async () => {
          setDeleting(true)
          const res = await fetch(`/api/resource/${id}`, { method: 'DELETE' })
          if (res.ok) {
            toast({ title: 'Deleted', variant: 'success' })
            router.push('/app/profile')
          } else {
            toast({ title: 'Failed to delete', variant: 'error' })
          }
          setDeleting(false)
          setShowConfirm(false)
        }}>Delete</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

**Where delete appears:** on edit pages for user-created entries (attachments, certifications, education). Positioned below the save button, visually separated. Not on bulk-replace pages (hobbies, skills) where the save replaces all items.

## When to Use What

| Pattern | When |
|---------|------|
| BottomSheet | Mobile-first actions, pickers, option lists — slides up, draggable |
| Dialog | Confirmations, destructive actions, important decisions — centered modal |
| Neither | Simple choices → use inline buttons. Don't modal when you don't need to. |

## Toast Notifications

For non-blocking feedback (save success, error messages). Via `useToast()` hook.

```tsx
const { toast } = useToast()
toast({ title: 'Saved', variant: 'success' })
toast({ title: 'Something went wrong', variant: 'error' })
```

Use toasts for API feedback. Don't use modals for success states — toast and move on.
