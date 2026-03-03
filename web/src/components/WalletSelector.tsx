"use client";

import { useConnect, Connector } from 'wagmi';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface WalletSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WalletSelector({ isOpen, onClose }: WalletSelectorProps) {
    const { connectors, connect, isPending, variables } = useConnect();

    const handleConnect = (connector: Connector) => {
        connect({ connector });
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-900 p-6 text-left align-middle shadow-xl border border-purple-500/30 transition-all">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
                                    >
                                        Connect Wallet
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid gap-3">
                                    {connectors.map((connector) => (
                                        <button
                                            key={connector.id}
                                            onClick={() => handleConnect(connector)}
                                            disabled={isPending && (variables as any)?.connector?.id === connector.id}
                                            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 relative bg-slate-700 rounded-lg p-2 group-hover:bg-slate-600 transition-colors">
                                                    {connector.icon ? (
                                                        <img src={connector.icon} alt={connector.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <div className="w-full h-full bg-purple-500/20 rounded" />
                                                    )}
                                                </div>
                                                <span className="font-semibold text-slate-200 group-hover:text-white">
                                                    {connector.name}
                                                </span>
                                            </div>
                                            <div className="text-xs text-purple-400 font-medium">
                                                {isPending && (variables as any)?.connector?.id === connector.id ? 'Connecting...' : 'Connect'}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <p className="mt-6 text-xs text-slate-400 text-center">
                                    By connecting, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
