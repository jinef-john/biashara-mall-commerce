'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarRange,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';
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
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Products',
    items: [{ label: 'Products', href: '/dashboard/products', icon: Package }],
  },
  {
    title: 'Events',
    items: [
      { label: 'Events', href: '/dashboard/events', icon: CalendarRange },
    ],
  },
  {
    title: 'Orders',
    items: [
      { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
    ],
  },
  {
    title: 'Users',
    items: [{ label: 'Users', href: '/dashboard/users', icon: Users }],
  },
  {
    title: 'Sellers',
    items: [{ label: 'Sellers', href: '/dashboard/sellers', icon: Store }],
  },
  {
    title: 'Customization',
    items: [
      {
        label: 'Customization',
        href: '/dashboard/customization',
        icon: Settings,
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
