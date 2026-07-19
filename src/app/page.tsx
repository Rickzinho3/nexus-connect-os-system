import { getCurrentTenantInfo } from "@/app/actions";
import HomeClient from "./page-client";

export default async function Page() {
  const currentTenant = await getCurrentTenantInfo();

  return (
    <HomeClient tenantName={currentTenant?.name} />
  );
}
