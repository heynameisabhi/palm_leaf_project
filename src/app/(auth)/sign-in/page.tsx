import { SignInForm } from '@/components/SignInForm'
import { FC } from 'react'

interface pageProps { }

const page: FC<pageProps> = ({ }) => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-black via-black to-emerald-950">
      <div className="w-full max-w-md relative">

        <div className="absolute -z-10 h-[200px] w-[200px] rounded-full bg-gradient-to-r from-green-900/20 to-emerald-800/20 blur-3xl -top-20 -left-20"></div>
        <div className="absolute -z-10 h-[200px] w-[200px] rounded-full bg-gradient-to-r from-emerald-900/20 to-green-800/20 blur-3xl -bottom-20 -right-20"></div>
        <SignInForm />
      </div>
    </main>
  )
}

export default page



