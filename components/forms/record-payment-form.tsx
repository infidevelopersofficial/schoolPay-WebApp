"use client"

import { useActionState, useState, useEffect } from "react"
import { recordPaymentAction, getFeeTypesAction, getStudentPendingFeesAction } from "@/app/(dashboard)/dashboard/payments/actions"
import { searchStudentsAction } from "@/app/(dashboard)/dashboard/students/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader2, Check, ChevronsUpDown } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"
import { cn } from "@/lib/utils"

interface RecordPaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RecordPaymentForm({ open, onOpenChange, onSuccess }: RecordPaymentFormProps) {
  const [state, formAction, isPending] = useActionState(recordPaymentAction, null)

  useFormEffect(state, {
    successMessage: "Payment recorded successfully!",
    onOpenChange,
    onSuccess,
  })

  // Data fetching state
  const [feeTypes, setFeeTypes] = useState<string[]>([])
  const [pendingFees, setPendingFees] = useState<any[]>([])
  const [selectedPendingFee, setSelectedPendingFee] = useState<any>(null)
  
  // Form field state (controlled for hidden inputs)
  const [feeType, setFeeType] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [amount, setAmount] = useState<string>("")

  // Combobox state
  const [studentOpen, setStudentOpen] = useState(false)
  const [studentQuery, setStudentQuery] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Fetch fee types on mount when dialog opens
  useEffect(() => {
    if (open && feeTypes.length === 0) {
      getFeeTypesAction().then((res) => {
        if ("success" in res && res.success && res.feeTypes) {
          setFeeTypes(res.feeTypes)
        }
       })
    }
  }, [open, feeTypes.length])

  // Fetch pending fees when student is selected
  useEffect(() => {
    if (selectedStudent?.id) {
      getStudentPendingFeesAction(selectedStudent.id).then((res) => {
        if ("success" in res && res.success && res.pendingFees) {
          setPendingFees(res.pendingFees)
        }
      })
    } else {
      setPendingFees([])
      setSelectedPendingFee(null)
    }
  }, [selectedStudent])

  // Debounce student search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!studentQuery) {
        setStudents([])
        return
      }
      setLoadingStudents(true)
      const res = await searchStudentsAction(studentQuery)
      if (Array.isArray(res)) {
        // Map the AsyncSearchOption format back to what the form expects
        const mappedStudents = res.map((r: any) => ({
          id: r.value,
          name: r.label,
          class: r.subLabel
        }))
        setStudents(mappedStudents)
      } else {
        setStudents([])
      }
      setLoadingStudents(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [studentQuery])

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setStudentQuery("")
      setStudents([])
      setSelectedStudent(null)
      setPaymentMethod("")
      setFeeType("")
      setAmount("")
      setPendingFees([])
      setSelectedPendingFee(null)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-visible">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          
          {/* Hidden inputs for native FormData extraction */}
          <input type="hidden" name="studentId" value={selectedStudent?.id || ""} />
          <input type="hidden" name="paymentMethod" value={paymentMethod} />
          <input type="hidden" name="feeType" value={selectedPendingFee ? selectedPendingFee.feeType : feeType} />
          <input type="hidden" name="feeMappingId" value={selectedPendingFee?.type === "MAPPING" ? selectedPendingFee.id : ""} />
          <input type="hidden" name="invoiceId" value={selectedPendingFee?.type === "INVOICE" ? selectedPendingFee.id : ""} />

          <div className="space-y-2 flex flex-col">
            <Label>Student <span className="text-red-500">*</span></Label>
            <Popover open={studentOpen} onOpenChange={setStudentOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={studentOpen}
                  className="w-full justify-between"
                >
                  {selectedStudent
                    ? `${selectedStudent.name} (${selectedStudent.studentId || selectedStudent.class})`
                    : "Search for a student..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[460px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search by student name..." 
                    value={studentQuery}
                    onValueChange={setStudentQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loadingStudents ? "Searching..." : studentQuery ? "No student found." : "Type a name to search..."}
                    </CommandEmpty>
                    <CommandGroup>
                      {students.map((student) => (
                        <CommandItem
                          key={student.id}
                          value={student.id}
                          onSelect={() => {
                            setSelectedStudent(student)
                            setStudentOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedStudent?.id === student.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {student.name} <span className="ml-1 text-muted-foreground text-xs">({student.studentId || student.class})</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Fee Type <span className="text-red-500">*</span></Label>
            <Select
              value={feeType}
              onValueChange={(val) => {
                setFeeType(val)
                const match = pendingFees.find((p) => p.name === val || p.feeType === val)
                if (match) {
                  setSelectedPendingFee(match)
                  setAmount(match.amount.toString())
                } else {
                  setSelectedPendingFee(null)
                }
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fee type or pending bill" />
              </SelectTrigger>
              <SelectContent>
                {pendingFees.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-primary bg-primary/5">Pending Bills & Invoices</div>
                    {pendingFees.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name} — ₹{p.amount}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1 border-t pt-2">General Fee Types</div>
                  </>
                )}
                {feeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount <span className="text-red-500">*</span></Label>
              <Input name="amount" type="number" step="0.01" placeholder="5000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Payment Method <span className="text-red-500">*</span></Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="ONLINE">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transaction ID</Label>
              <Input name="transactionId" placeholder="TXN123456" />
            </div>
            <div className="space-y-2">
              <Label>Receipt Number</Label>
              <Input name="receiptNumber" placeholder="Auto-generated" />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !selectedStudent || !feeType || !paymentMethod}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
