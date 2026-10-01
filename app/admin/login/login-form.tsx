"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    null
  );

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-20">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-center text-2xl font-bold">Panel de administración</h1>
        <p className="mt-1 text-center text-sm text-zinc-500">
          Ingresa tus credenciales para continuar.
        </p>

        {state?.error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="user"
              className="block text-sm font-medium text-zinc-700"
            >
              Usuario
            </label>
            <input
              id="user"
              name="user"
              type="text"
              autoComplete="username"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {pending ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}