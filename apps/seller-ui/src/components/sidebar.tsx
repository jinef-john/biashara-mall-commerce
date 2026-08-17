'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, PackagePlus } from 'lucide-react';
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@biashara-mall/ui/components/ui/sidebar';

const NAV = [
  {
    title: 'Products',
    items: [
      {
        label: 'Create Product',
        href: '/dashboard/create-product',
        icon: PackagePlus,
      },
      {
        label: 'All Products',
        href: '/dashboard/all-products',
        icon: Package,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <SidebarRoot
      collapsible="icon"
      className="top-(--header-height) bottom-auto h-[calc(100svh-var(--header-height))]"
    >
      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </SidebarRoot>
  );
}
