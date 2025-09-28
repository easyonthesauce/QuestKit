import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { familyService } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface FamilySetupForm {
  name: string
  description?: string
}

export default function FamilySetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FamilySetupForm>()

  const onSubmit = async (data: FamilySetupForm) => {
    try {
      setIsLoading(true)
      await familyService.createFamily(data.name, data.description)
      toast.success('Family created successfully!')
      navigate('/')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create family'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-center mb-2">Create Your Family</h2>
      <p className="text-gray-600 text-center mb-6">
        Set up your family's quest adventure
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Family Name
          </label>
          <input
            {...register('name', { 
              required: 'Family name is required',
              minLength: {
                value: 2,
                message: 'Family name must be at least 2 characters'
              }
            })}
            type="text"
            className="input w-full"
            placeholder="The Smith Family"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            {...register('description')}
            className="input w-full resize-none"
            rows={3}
            placeholder="Tell us about your family's quest goals..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full flex items-center justify-center"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Create Family'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}