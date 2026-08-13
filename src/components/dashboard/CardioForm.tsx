import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useWorkout } from '@/contexts/WorkoutContext';
import { CardioType, CARDIO_TYPE_LABELS, metersToMiles } from '@/types/workout';

const cardioSchema = z.object({
  date: z.date({ required_error: 'Date is required' }),
  type: z.enum(['run_walk_ruck', 'bike', 'swim', 'row_elliptical'], {
    required_error: 'Cardio type is required',
  }),
  distance: z.number({ required_error: 'Distance is required' })
    .positive('Distance must be greater than 0')
    .max(100, 'Distance seems unrealistic'),
  distanceUnit: z.enum(['miles', 'meters']),
  notes: z.string().optional(),
});

type CardioFormValues = z.infer<typeof cardioSchema>;

export function CardioForm() {
  const { addCardioLog } = useWorkout();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CardioFormValues>({
    resolver: zodResolver(cardioSchema),
    defaultValues: {
      distanceUnit: 'miles',
      notes: '',
    },
  });

  const onSubmit = async (data: CardioFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert meters to miles if needed
      const distanceInMiles = data.distanceUnit === 'meters' 
        ? metersToMiles(data.distance) 
        : data.distance;

      await addCardioLog({
        date: data.date,
        type: data.type as CardioType,
        distance: distanceInMiles,
        distanceUnit: data.distanceUnit,
        originalDistance: data.distance,
        notes: data.notes,
      });

      toast({
        title: 'Cardio logged!',
        description: `${distanceInMiles.toFixed(2)} miles added to your total.`,
      });

      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log cardio. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : 'Select date'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cardio Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Select cardio type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border">
                  {Object.entries(CARDIO_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="distance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distance</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="bg-secondary"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="distanceUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="miles">Miles</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes about this workout..."
                  className="bg-secondary resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TODO: Proof upload field placeholder */}

        <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Logging...' : 'Log Cardio'}
        </Button>
      </form>
    </Form>
  );
}
