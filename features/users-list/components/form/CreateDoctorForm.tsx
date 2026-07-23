import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateUser } from "../../api/use-create-user";
import { specializations } from "../../../auth/types/auth";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email"),
  phone_number: z.string().min(1, "Phone number is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role: z.literal("doctor"),
  status: z.enum(["active", "inactive"], {
    required_error: "Status is required",
  }),
  specialization: z.string().min(2, "Specialization is required"),
  clinic_id: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    },
    z.number().int().positive().nullable()
  ),
});

interface Props {
  setOpen: (open: boolean) => void;
}

type DoctorFormValues = z.infer<typeof schema>;

const defaultValues: DoctorFormValues = {
  username: "",
  password: "",
  email: "",
  phone_number: "",
  first_name: "",
  last_name: "",
  role: "doctor",
  status: "active",
  specialization: "",
  clinic_id: null,
};

const CreateDoctorForm = ({ setOpen }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useCreateUser("doctor");

  const onSubmit: SubmitHandler<DoctorFormValues> = (data) => {
    mutation.mutate(
      {
        ...data,
        clinic_id: data.clinic_id ?? undefined,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-5xl mx-auto p-6 space-y-6"
    >
      <p className="text-sm text-muted-foreground">
        Clinic is optional — doctors can work independently and be assigned to a
        clinic later.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            {...register("username")}
            placeholder="Enter username"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          />
          {errors.username && (
            <span className="text-red-500 text-xs mt-1">
              {errors.username.message}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="flex w-full">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="Enter password"
              className="border rounded-lg px-3 py-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="relative -left-2 top-5 -ml-5 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <span className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </span>
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
            <span className="text-red-500 text-xs mt-1">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
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
          <label className="text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            {...register("first_name")}
            placeholder="Enter first name"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          />
          {errors.first_name && (
            <span className="text-red-500 text-xs mt-1">
              {errors.first_name.message}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            {...register("last_name")}
            placeholder="Enter last name"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          />
          {errors.last_name && (
            <span className="text-red-500 text-xs mt-1">
              {errors.last_name.message}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            {...register("status")}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {errors.status && (
            <span className="text-red-500 text-xs mt-1">
              {errors.status.message}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Specialization
          </label>
          <select
            {...register("specialization")}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          >
            <option value="">Select specialization</option>
            {specializations.map((s: string) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.specialization && (
            <span className="text-red-500 text-xs mt-1">
              {errors.specialization.message}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Clinic ID (optional)
          </label>
          <input
            type="number"
            {...register("clinic_id")}
            placeholder="Leave empty for independent"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          />
          {errors.clinic_id && (
            <span className="text-red-500 text-xs mt-1">
              {errors.clinic_id.message as string}
            </span>
          )}
        </div>
      </div>

      <input type="hidden" value="doctor" {...register("role")} />

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-md transition-all mt-10"
      >
        Create doctor
      </button>
    </form>
  );
};

export default CreateDoctorForm;
