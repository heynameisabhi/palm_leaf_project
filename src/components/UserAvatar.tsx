import { FC } from 'react'
import { Avatar, AvatarFallback } from './ui/Avatar'
import Image from 'next/image'
import { AvatarProps } from '@radix-ui/react-avatar'
import { User } from 'lucide-react'

interface UserAvatarProps extends AvatarProps {
    user: {
        name?: string | null
        image?: string | null
    }
}

const UserAvatar: FC<UserAvatarProps> = ({user, ...props}) => {
  return (
    <Avatar {...props}>
        {user.image ? (
            <div className='relative aspect-square h-full w-full'>
                <Image fill src={user.image} alt='profile' referrerPolicy='no-referrer' />
            </div>
        ) : (
            <AvatarFallback>
                <span className='sr-only'>
                    {user?.name}
                </span>
                <User className='h-4 w-4' />
            </AvatarFallback>
        )}
    </Avatar>
  )
}

export default UserAvatar