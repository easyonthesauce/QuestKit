import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CreateUserRequest } from '@questkit/shared'
import { useAuthStore } from '@/stores/authStore'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CreateUserRequest & { confirmPassword: string }>()

  const password = watch('password')

  const onSubmit = async (data: CreateUserRequest & { confirmPassword: string }) => {
    try {
      const { confirmPassword, ...userData } = data
      await registerUser(userData)
      
      // If user doesn't have a family, redirect to family setup
      if (!userData.familyInviteCode) {
        navigate('/auth/family-setup')
      } else {
        navigate('/')
      }
    } catch (error) {
      // Error handled in store
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-center mb-6">Join QuestKit</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email'
              }
            })}
            type="email"
            className="input w-full"
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            {...register('username', { 
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters'
              },
              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,
                message: 'Username can only contain letters, numbers, underscores, and dashes'
              }
            })}
            type="text"
            className="input w-full"
            placeholder="cooluser123"
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            {...register('displayName', { 
              required: 'Display name is required',
              minLength: {
                value: 2,
                message: 'Display name must be at least 2 characters'
              }
            })}
            type="text"
            className="input w-full"
            placeholder="Your Name"
          />
          {errors.displayName && (
            <p className="text-red-500 text-sm mt-1">{errors.displayName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              }
            })}
            type="password"
            className="input w-full"
            placeholder="Create a strong password"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            {...register('confirmPassword', { 
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
            type="password"
            className="input w-full"
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="familyInviteCode" className="block text-sm font-medium text-gray-700 mb-1">
            Family Invite Code (Optional)
          </label>
          <input
            {...register('familyInviteCode')}
            type="text"
            className="input w-full"
            placeholder="ABC123"
            maxLength={6}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to create a new family later
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full flex items-center justify-center"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary-600 hover:text-primary-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}