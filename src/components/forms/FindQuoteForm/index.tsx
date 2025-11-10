'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import React, { Fragment, useCallback } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  quoteID: string
}

type Props = {
  initialEmail?: string
}

export const FindQuoteForm: React.FC<Props> = ({ initialEmail }) => {
  const router = useRouter()
  const { user } = useAuth()

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>({
    defaultValues: {
      email: initialEmail || user?.email,
    },
  })

  const onSubmit = useCallback(
    async (data: FormData) => {
      router.push(`/quotes/${data.quoteID}?email=${data.email}`)
    },
    [router],
  )

  return (
    <Fragment>
      <h1 className="text-xl mb-4">Find my quote</h1>
      <div className="prose dark:prose-invert mb-8">
        <p>{`Please enter your email and quote ID below.`}</p>
      </div>
      <form className="max-w-lg flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
        <FormItem>
          <Label htmlFor="email" className="mb-2">
            Email address
          </Label>
          <Input
            id="email"
            {...register('email', { required: 'Email is required.' })}
            type="email"
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>
        <FormItem>
          <Label htmlFor="quoteID" className="mb-2">
            Quote ID
          </Label>
          <Input
            id="quoteID"
            {...register('quoteID', {
              required: 'Quote ID is required. You can find this in your email.',
            })}
            type="text"
          />
          {errors.quoteID && <FormError message={errors.quoteID.message} />}
        </FormItem>
        <Button type="submit" className="self-start" variant="default">
          Find my quote
        </Button>
      </form>
    </Fragment>
  )
}
