'use client';

import React from 'react';
import { X, Network, Cpu, Database, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { CrossContractInvocationNode, InvocationTraceSummary } from '../../../../../packages/contracts-client/src/crossContractAdapter';

export interface CrossContractTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootNode: CrossContractInvocationNode | null;
  summary: InvocationTraceSummary;
}

export const CrossContractTraceModal: React.FC<CrossContractTraceModalProps> = ({
  isOpen,
  onClose,
  rootNode,
  summary,
}) => {
  if (!isOpen || !rootNode) return null;

  const renderNode = (node: CrossContractInvocationNode) => {
    const isRoot = node.depth === 0;
    const cpuPercent =
      summary.totalCpuInstructions > 0
        ? ((node.cpuInstructionsUsed / summary.totalCpuInstructions) * 100).toFixed(1)
        : '0';

    return (
      <div key={node.id} className="space-y-2">
        <div
          className={`flex items-start justify-between p-3.5 rounded-xl border transition-colors ${
            isRoot
              ? 'bg-emerald-950/30 border-emerald-500/30'
              : 'bg-slate-900/80 border-slate-800'
          }`}
          style={{ marginLeft: `${node.depth * 24}px` }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                  isRoot
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {node.contractName || 'Contract'}
              </span>
              <span className="text-sm font-mono font-medium text-white flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-slate-500" />
                {node.functionName}()
              </span>
              {node.status === 'SUCCESS' ? (
                <span className="flex items-center text-xs text-emerald-400 gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Success
                </span>
              ) : (
                <span className="flex items-center text-xs text-rose-400 gap-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Reverted
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-slate-400 truncate max-w-sm">
              ID: {node.contractId}
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="flex items-center gap-1 text-xs font-mono text-slate-300 justify-end">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>{node.cpuInstructionsUsed.toLocaleString()} CPU</span>
              <span className="text-slate-500">({cpuPercent}%)</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-slate-400 justify-end">
              <Database className="w-3 h-3 text-blue-400" />
              <span>{node.memoryBytesUsed.toLocaleString()} B Mem</span>
            </div>
          </div>
        </div>

        {node.children.map((child) => renderNode(child))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Cross-Contract Invocation Call DAG</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trace Summary Banner */}
        <div className="bg-slate-900/60 px-6 py-3 border-b border-slate-800/80 grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-400 block">Total Sub-Calls</span>
            <span className="font-mono font-bold text-white text-sm">{summary.totalNodes}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Max Tree Depth</span>
            <span className="font-mono font-bold text-white text-sm">{summary.maxDepth}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Total CPU</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {summary.totalCpuInstructions.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Involved Contracts</span>
            <span className="font-mono font-bold text-blue-400 text-sm">
              {summary.involvedContracts.length}
            </span>
          </div>
        </div>

        {/* Tree List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {renderNode(rootNode)}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
};
