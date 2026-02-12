"use client";

import { FormEvent, useMemo, useState } from "react";

import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authedPost, useApiQuery, useAuthProfile } from "@/lib/api-client";

export default function UsersRolesPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const { token, roles, ready } = useAuthProfile();

  const canManageUsers = useMemo(() => roles.includes("admin"), [roles]);

  const users = useApiQuery<Array<any>>(canManageUsers ? "/users?page=1&page_size=30" : null, [], [canManageUsers]);
  const rolesQuery = useApiQuery<Array<any>>(canManageUsers ? "/roles?page=1&page_size=30" : null, [], [canManageUsers]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState("viewer");
  const [message, setMessage] = useState<string | null>(null);

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !canManageUsers) return;
    try {
      await authedPost("/users", token, {
        username,
        password,
        role_names: [roleName]
      });
      setMessage("کاربر با موفقیت ایجاد شد.");
      setUsername("");
      setPassword("");
    } catch (err) {
      if (err instanceof Error && err.message === "status_403") {
        setMessage("دسترسی لازم برای مدیریت کاربران وجود ندارد.");
      } else {
        setMessage("ایجاد کاربر ناموفق بود.");
      }
    }
  };

  return (
    <ModulePage
      locale={locale}
      title="مدیریت سامانه | کاربران و نقش‌ها"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "مدیریت سامانه" }, { label: "کاربران و نقش‌ها" }]}
      loading={!ready || (canManageUsers && (users.loading || rolesQuery.loading))}
      error={canManageUsers && (users.error || rolesQuery.error) ? "خطا در دریافت کاربران/نقش‌ها" : null}
      empty={false}
    >
      {!canManageUsers ? (
        <Panel title="عدم دسترسی">
          <p className="text-sm text-muted-foreground">
            این بخش فقط برای نقش مدیر سامانه فعال است. لطفا با حساب `admin` وارد شوید یا از مدیر درخواست سطح دسترسی کنید.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="ایجاد کاربر جدید">
            <form onSubmit={createUser} className="space-y-2">
              <Input placeholder="نام کاربری" value={username} onChange={(e) => setUsername(e.target.value)} />
              <Input placeholder="رمز عبور" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Select value={roleName} onChange={(e) => setRoleName(e.target.value)}>
                {rolesQuery.data.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" disabled={!token}>
                ایجاد کاربر
              </Button>
              {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
            </form>
          </Panel>

          <div className="xl:col-span-2">
            <Panel title="لیست کاربران">
              <div className="overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام کاربری</TableHead>
                      <TableHead>نقش‌ها</TableHead>
                      <TableHead>فعال</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.data.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{(user.roles ?? []).join("، ")}</TableCell>
                        <TableCell>{user.is_active ? "بله" : "خیر"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </ModulePage>
  );
}

