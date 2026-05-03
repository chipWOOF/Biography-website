import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scenario, ScenarioDifficulty } from '@/types/simulation';

interface ScenarioBuilderFormProps {
  onCreate: (scenario: Scenario) => void;
}

interface FormState {
  companySize: 'small' | 'medium' | 'large';
  securityBudget: 'low' | 'medium' | 'high';
  employeeAwareness: number;
  systemVulnerability: number;
}

interface ValidationErrors {
  employeeAwareness?: string;
  systemVulnerability?: string;
}

const initialFormState: FormState = {
  companySize: 'medium',
  securityBudget: 'medium',
  employeeAwareness: 0.6,
  systemVulnerability: 0.4
};

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const deriveDifficulty = (awareness: number, vulnerability: number): ScenarioDifficulty => {
  if (vulnerability >= 0.75 || awareness <= 0.25) return 'hard';
  if (vulnerability >= 0.45 || awareness <= 0.5) return 'medium';
  return 'easy';
};

export function ScenarioBuilderForm({ onCreate }: ScenarioBuilderFormProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const scenarioPreview = useMemo<Scenario>(() => {
    const sizeLabel = form.companySize.charAt(0).toUpperCase() + form.companySize.slice(1);
    const difficulty = deriveDifficulty(form.employeeAwareness, form.systemVulnerability);

    return {
      name: `${sizeLabel} Company (${form.securityBudget})`,
      description: `${sizeLabel} company with ${form.securityBudget} security budget and ${Math.round(form.employeeAwareness * 100)}% employee awareness.`,
      difficulty,
      environment: {
        networkComplexity: form.companySize === 'small' ? 0.4 : form.companySize === 'medium' ? 0.65 : 0.85,
        userAwareness: form.employeeAwareness,
        systemVulnerability: form.systemVulnerability
      }
    };
  }, [form]);

  const validate = () => {
    const validationErrors: ValidationErrors = {};

    if (form.employeeAwareness < 0 || form.employeeAwareness > 1) {
      validationErrors.employeeAwareness = 'Employee awareness must be between 0 and 1.';
    }
    if (form.systemVulnerability < 0 || form.systemVulnerability > 1) {
      validationErrors.systemVulnerability = 'System vulnerability must be between 0 and 1.';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    onCreate(scenarioPreview);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company-size">Company Size</Label>
          <Select value={form.companySize} onValueChange={(value) => setForm(prev => ({ ...prev, companySize: value as FormState['companySize'] }))}>
            <SelectTrigger id="company-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="security-budget">Security Budget</Label>
          <Select value={form.securityBudget} onValueChange={(value) => setForm(prev => ({ ...prev, securityBudget: value as FormState['securityBudget'] }))}>
            <SelectTrigger id="security-budget">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employee-awareness">Employee Awareness</Label>
          <Input
            id="employee-awareness"
            type="number"
            step="0.01"
            min={0}
            max={1}
            value={form.employeeAwareness}
            onChange={(event) => setForm(prev => ({
              ...prev,
              employeeAwareness: clamp(Number.parseFloat(event.target.value), 0, 1)
            }))}
          />
          {errors.employeeAwareness ? <p className="text-xs text-red-600 mt-1">{errors.employeeAwareness}</p> : null}
        </div>

        <div>
          <Label htmlFor="system-vulnerability">System Vulnerability</Label>
          <Input
            id="system-vulnerability"
            type="number"
            step="0.01"
            min={0}
            max={1}
            value={form.systemVulnerability}
            onChange={(event) => setForm(prev => ({
              ...prev,
              systemVulnerability: clamp(Number.parseFloat(event.target.value), 0, 1)
            }))}
          />
          {errors.systemVulnerability ? <p className="text-xs text-red-600 mt-1">{errors.systemVulnerability}</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-gray-600">Quick testing defaults are preloaded for immediate simulation.</p>
        </div>
        <Button type="submit" className="w-full md:w-auto">Create Scenario</Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-lg font-semibold">Scenario Preview</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div><strong>Name:</strong> {scenarioPreview.name}</div>
          <div><strong>Difficulty:</strong> {scenarioPreview.difficulty}</div>
          <div><strong>Company Size:</strong> {form.companySize}</div>
          <div><strong>Security Budget:</strong> {form.securityBudget}</div>
          <div><strong>Awareness:</strong> {(scenarioPreview.environment.userAwareness * 100).toFixed(0)}%</div>
          <div><strong>Vulnerability:</strong> {(scenarioPreview.environment.systemVulnerability * 100).toFixed(0)}%</div>
        </div>
      </div>
    </form>
  );
}
