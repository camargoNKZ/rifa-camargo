'use client';

import { useMemo, useState } from 'react';
import { Heart, Search, Sparkles, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Entry = { name: string; phone: string; paid: boolean };

const NUMBERS = Array.from({ length: 100 }, (_, index) => index + 1);

export default function Home() {
  const [entries] = useState<Record<number, Entry>>({
    7: { name: 'Ana Martins', phone: '(11) 99999-0000', paid: true },
    23: { name: 'Carla Souza', phone: '(11) 98888-1111', paid: false },
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const reserved = Object.keys(entries).length;
  const paid = Object.values(entries).filter((entry) => entry.paid).length;
  const filteredNumbers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return NUMBERS;
    return NUMBERS.filter((number) => {
      const entry = entries[number];
      return (
        String(number).padStart(2, '0').includes(normalized) ||
        entry?.name.toLowerCase().includes(normalized)
      );
    });
  }, [entries, query]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-primary/15 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Heart className="size-5 fill-current" />
            </div>
            <div>
              <p className="font-display text-2xl leading-none text-primary">Rifa doce</p>
              <p className="mt-1 text-sm text-muted-foreground">Camargo Confeitaria</p>
            </div>
          </div>
          <Badge className="h-7 bg-pink-100 px-3 text-primary">Prêmio de até R$ 200</Badge>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
        <div className="mb-7 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-pink-600">
              <Sparkles className="size-4" /> Gestão da rifa
            </p>
            <h1 className="max-w-2xl font-display text-4xl leading-tight text-primary sm:text-5xl">
              Números e compradores
            </h1>
            <p className="mt-2 max-w-xl text-base text-muted-foreground">
              Toque em um número para cadastrar, consultar ou atualizar o comprador.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Stat value={100 - reserved} label="Livres" tone="cream" />
            <Stat value={reserved} label="Reservados" tone="pink" />
            <Stat value={paid} label="Pagos" tone="wine" />
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por número ou comprador"
              className="h-11 border-0 bg-muted pl-10 shadow-none"
            />
          </label>
          <div className="flex items-center gap-4 px-2 text-sm text-muted-foreground">
            <Legend color="bg-card" label="Livre" />
            <Legend color="bg-pink-100" label="Reservado" />
            <Legend color="bg-primary" label="Pago" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 sm:gap-3">
          {filteredNumbers.map((number) => {
            const entry = entries[number];
            return (
              <button
                key={number}
                type="button"
                onClick={() => setSelected(number)}
                className={`group relative aspect-square rounded-2xl border text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 ${
                  entry?.paid
                    ? 'border-primary bg-primary text-primary-foreground'
                    : entry
                      ? 'border-pink-200 bg-pink-100 text-primary'
                      : 'border-primary/15 bg-card text-primary hover:border-primary/40'
                }`}
                aria-label={`Número ${number}${entry ? `, ${entry.name}` : ', livre'}`}
              >
                <span className="absolute left-2.5 top-2 text-lg font-bold sm:text-xl">
                  {String(number).padStart(2, '0')}
                </span>
                {entry && <UserRound className="absolute bottom-2.5 right-2.5 size-4 opacity-70" />}
              </button>
            );
          })}
        </div>
      </section>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="border-primary/15 p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-primary">
              Número {selected ? String(selected).padStart(2, '0') : ''}
            </DialogTitle>
            <DialogDescription>
              {selected && entries[selected]
                ? `Reservado para ${entries[selected].name}.`
                : 'Este número está disponível para cadastro.'}
            </DialogDescription>
          </DialogHeader>
          <Button className="h-11" onClick={() => setSelected(null)}>
            {selected && entries[selected] ? 'Editar cadastro' : 'Cadastrar comprador'}
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: 'cream' | 'pink' | 'wine' }) {
  const tones = {
    cream: 'bg-amber-50 text-amber-950',
    pink: 'bg-pink-100 text-primary',
    wine: 'bg-primary text-primary-foreground',
  };
  return (
    <div className={`min-w-20 rounded-2xl px-3 py-3 text-center sm:min-w-28 ${tones[tone]}`}>
      <strong className="block text-2xl leading-none">{value}</strong>
      <span className="mt-1 block text-xs font-medium">{label}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={`size-3 rounded-full border border-primary/15 ${color}`} />
      {label}
    </span>
  );
}
