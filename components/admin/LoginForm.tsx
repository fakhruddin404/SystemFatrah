'use client';

import { useFormState } from 'react-dom';
import { signIn } from '@/app/admin/login/actions';
import Field, { inputClass } from '@/components/admin/Field';
import SubmitButton from '@/components/admin/SubmitButton';

export default function LoginForm() {
  const [state, formAction] = useFormState(signIn, null);

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      {state?.error ? (
        <p role="alert" className="text-sm text-maroon">
          {state.error}
        </p>
      ) : null}
      <SubmitButton className="w-full">Sign in</SubmitButton>
    </form>
  );
}
