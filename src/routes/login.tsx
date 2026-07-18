import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login } from '@/lib/auth'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, Wrench, GraduationCap, ChevronRight } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

const DEMO_ACCOUNTS = [
  {
    role: 'Administrator',
    email: 'admin@maintainiq.demo',
    password: 'Demo@1234',
    icon: ShieldCheck,
    color: 'text-purple-600',
    bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
  },
  {
    role: 'Technician',
    email: 'tech@maintainiq.demo',
    password: 'Demo@1234',
    icon: Wrench,
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    role: 'Student / Reporter',
    email: 'student@maintainiq.demo',
    password: 'Demo@1234',
    icon: GraduationCap,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
]

function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const initialize = useAuthStore((state) => state.initialize)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      await initialize()
      navigate({ to: '/' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email: string, password: string) => {
    form.setValue('email', email)
    form.setValue('password', password)
    toast.info('Demo credentials filled — click Sign In')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-slate-800 p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">MaintainIQ</h1>
          </div>
          <p className="text-slate-400 text-sm">Inventory Management · QR Tracking · Reporting</p>
        </div>

        {/* Login form */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Access your MaintainIQ account</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>

            <div className="mt-5 space-y-2 text-sm text-center text-slate-500">
              <div>
                <button
                  onClick={() => navigate({ to: '/forgot-password' })}
                  className="text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div>
                Don't have an account?{' '}
                <button
                  onClick={() => navigate({ to: '/signup' })}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Create account
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <div className="space-y-2">
          <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-widest">
            Demo Accounts — click to fill
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon
              return (
                <button
                  key={account.role}
                  onClick={() => fillDemo(account.email, account.password)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${account.bg}`}
                >
                  <div className={`shrink-0 ${account.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${account.badge}`}>
                        {account.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate font-mono">{account.email}</p>
                    <p className="text-xs text-slate-500 font-mono">Demo@1234</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
