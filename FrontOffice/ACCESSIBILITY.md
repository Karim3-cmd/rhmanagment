# Accessibility Bonus Module

This frontend now includes an accessibility assistant for users with disabilities and reduced comfort needs.

## Implemented features

- Floating accessibility button available on every page.
- Keyboard shortcut: `Alt + A` opens/closes the accessibility panel.
- Skip link: keyboard users can jump directly to the main content.
- Semantic landmarks: authentication pages and dashboard content use `main`; dashboard navigation uses `aside` and `nav`.
- Visible keyboard focus ring for buttons, links, inputs, selects, and custom controls.
- Persistent settings saved in `localStorage` under `hrbrain_accessibility_settings`.
- High contrast mode for low-vision users.
- Large text mode.
- Readable/dyslexia-friendly font spacing mode.
- Reduced motion mode for motion-sensitive users.
- Large focus/cursor mode for motor accessibility.
- Reading guide ruler for users with reading fatigue or attention difficulty.
- Login and signup forms now expose validation errors through `role="alert"`, `aria-invalid`, and `aria-describedby`.

## Files changed

- `src/app/App.tsx`
- `src/app/components/accessibility/AccessibilityAssistant.tsx`
- `src/app/components/auth/Login.tsx`
- `src/app/components/auth/Signup.tsx`
- `src/app/components/dashboard/Dashboard.tsx`
- `src/app/components/dashboard/Sidebar.tsx`
- `src/styles/theme.css`
- `index.html`

## How to test manually

1. Start the frontend.
2. Press `Tab`: the “Skip to main content” link should appear.
3. Press `Alt + A`: the accessibility panel should open.
4. Enable each option and verify the interface updates immediately.
5. Refresh the page: selected accessibility settings should stay active.
6. Submit the login/signup form empty: screen-reader-friendly error alerts should appear.
7. Navigate the sidebar using only the keyboard.
