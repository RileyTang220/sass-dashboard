<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue';
import Topbar from '@/components/layout/Topbar.vue';
import { RouterView } from 'vue-router';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
} from '@headlessui/vue';

const settingsStore = useSettingsStore();
</script>

<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-950 font-sans overflow-hidden">
    
    <!-- Static sidebar for desktop -->
    <Sidebar class="hidden md:flex" />

    <!-- Mobile sidebar -->
    <TransitionRoot appear :show="settingsStore.isMobileSidebarOpen" as="template">
      <Dialog as="div" @close="settingsStore.toggleMobileSidebar" class="relative z-50 md:hidden">
        
        <!-- Backdrop -->
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/30" />
        </TransitionChild>

        <!-- Mobile Sidebar Panel -->
        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
              <Sidebar class="flex" />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
    
    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Topbar />
      
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
        <div class="max-w-7xl mx-auto">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>