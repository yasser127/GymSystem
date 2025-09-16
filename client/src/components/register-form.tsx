import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import axios from "axios";
import { useGetMeQuery, previllageChecker } from "@/services/previllageChecker";
import { useAppDispatch } from "@/store/hooks";

type FormValues = {
  name: string;
  gender: "Male" | "Female" | "Other";
  email: string;
  username: string;
  password: string;
  isAdmin: boolean;
};


type Props = React.HTMLAttributes<HTMLDivElement>;

export function RegisterForm({ className, ...props }: Props) {
  const [values, setValues] = useState<FormValues>({
    name: "",
    gender: "Other",
    email: "",
    username: "",
    password: "",
    isAdmin: false,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const dispatch = useAppDispatch();
  const token: string | null =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;


  const { data: meData } = useGetMeQuery(undefined, { skip: !token });


  const canCreateAdmin: boolean = !!meData?.isAdmin;

  
  useEffect(() => {
    if (!canCreateAdmin && values.isAdmin) {
      setValues((prev) => ({ ...prev, isAdmin: false }));
    }

  }, [canCreateAdmin]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name } = target;

 
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      const checked = (target as HTMLInputElement).checked;
      setValues(
        (prev) => ({ ...prev, [name]: checked } as unknown as FormValues)
      );
      return;
    }

    if (name === "gender") {
      const val = (target as HTMLSelectElement).value as FormValues["gender"];
      setValues((prev) => ({ ...prev, gender: val }));
      return;
    }

  
    const val = (target as HTMLInputElement).value;
    setValues((prev) => ({ ...prev, [name]: val } as unknown as FormValues));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

 
    if (values.isAdmin && !canCreateAdmin) {
      setMessage({
        type: "error",
        text: "You are not authorized to create admin users.",
      });
      return;
    }

    setLoading(true);

    try {
    
      const payload: Record<string, unknown> = {
        name: values.name,
        gender: values.gender,
        email: values.email,
        username: values.username,
        password: values.password,
      };
      if (values.isAdmin) {
        payload.userType = "admin";
      }

    
      const headers =
        values.isAdmin && token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

      const response = await axios.post(
        "http://localhost:3000/auth/register",
        payload,
        headers ? { headers } : undefined
      );

      if (response.status >= 200 && response.status < 300) {
        setMessage({
          type: "success",
          text: response.data?.message || "Registered successfully",
        });

        // clear form
        setValues({
          name: "",
          gender: "Other",
          email: "",
          username: "",
          password: "",
          isAdmin: false,
        });

       
        dispatch(previllageChecker.util.resetApiState() as any);
      } else {
        setMessage({
          type: "error",
          text: response.data?.message || "Registration failed",
        });
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
    
        const serverMessage =
          typeof err.response?.data === "object" &&
          err.response?.data !== null &&
          "message" in err.response.data
            ? (err.response.data as { message: string }).message
            : undefined;

        setMessage({
          type: "error",
          text: serverMessage || err.message || "Request failed",
        });
      } else if (err instanceof Error) {
        setMessage({ type: "error", text: err.message });
      } else {
        setMessage({ type: "error", text: "An unknown error occurred" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 ", className)} {...props}>
      <Card className="from-blue-100 to-blue-200 bg-gradient-to-r">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Fill the form to create a new member or admin account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jane Doe"
                  required
                  value={values.name}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  name="gender"
                  value={values.gender}
                  onChange={handleChange}
                  className="px-3 py-2 rounded-md border"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="dumbbell@axmail.com"
                  required
                  value={values.email}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="username">User name</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="arnold"
                  required
                  value={values.username}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={values.password}
                  onChange={handleChange}
                />
              </div>

      
              {canCreateAdmin ? (
                <div className="flex items-center gap-2">
                  <input
                    id="isAdmin"
                    name="isAdmin"
                    type="checkbox"
                    checked={values.isAdmin}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isAdmin">Is this user an admin?</Label>
                </div>
              ) : (
          
                <div className="text-sm text-gray-500">
                  Only administrators may create admin users.
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  variant="vibrant"
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Signing up..." : "Sign up"}
                </Button>
              </div>

              {message && (
                <div
                  className={`mt-2 text-sm ${
                    message.type === "error" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
