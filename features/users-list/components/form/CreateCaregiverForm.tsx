import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateUser } from "../../api/use-create-user";
import { relationships } from "../../../auth/types/auth";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  role: z.literal("caregiver"),
  status: z.enum(["active", "inactive"], { required_error: "Status is required" }),
  relationship_to_patient: z.string().optional(),
});

interface Props {
  setOpen: (open: boolean) => void;
}

type CaregiverFormValues = z.infer<typeof schema>;

const defaultValues: CaregiverFormValues = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  role: "caregiver",
  status: "active",
  relationship_to_patient: "",
};

const CreateCaregiverForm = ({ setOpen }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CaregiverFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const mutation = useCreateUser("caregiver");

  const onSubmit: SubmitHandler<CaregiverFormValues> = (data) => {
    mutation.mutate(data, {
      onSuccess: () => {
        reset();
        setOpen(false);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto p-6">
      <p className="mb-4 text-sm text-muted-foreground">
        A secure password is generated and emailed to the caregiver.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            {...register("username")}
            placeholder="Enter username"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          />
          {errors.username && (
            <span className="text-red-500 text-xs mt-1">{errors.username.message}</span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            {...register("email")}
            placeholder="Enter email"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          />
          {errors.email && (
            <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            {...register("first_name")}
            placeholder="Enter first name"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          />
          {errors.first_name && (
            <span className="text-red-500 text-xs mt-1">{errors.first_name.message}</span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            {...register("last_name")}
            placeholder="Enter last name"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          />
          {errors.last_name && (
            <span className="text-red-500 text-xs mt-1">{errors.last_name.message}</span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            {...register("phone_number")}
            placeholder="Enter phone number"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          />
          {errors.phone_number && (
            <span className="text-red-500 text-xs mt-1">
              {errors.phone_number.message}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            {...register("status")}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          >
            <option value="">Select status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {errors.status && (
            <span className="text-red-500 text-xs mt-1">{errors.status.message}</span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Relationship to Patient
          </label>
          <select
            {...register("relationship_to_patient")}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          >
            <option value="">Select relationship</option>
            {relationships.map((rel) => (
              <option key={rel} value={rel}>
                {rel}
              </option>
            ))}
          </select>
          {errors.relationship_to_patient && (
            <span className="text-red-500 text-xs mt-1">
              {errors.relationship_to_patient.message}
            </span>
          )}
        </div>
      </div>

      <input type="hidden" value="caregiver" {...register("role")} />

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-md transition-all mt-10"
      >
        Create
      </button>
    </form>
  );
};

export default CreateCaregiverForm;
