import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { DayPickerModal } from '@/components/DayPickerModal';
import { TextField } from '@/components/TextField';
import { AddressAutocomplete } from '@/features/realEstate/AddressAutocomplete';
import { RealEstateTradeLookup } from '@/features/realEstate/RealEstateTradeLookup';
import { getErrorMessage } from '@/lib/apiClient';
import { formatAmountInput, formatDecimalAmountInput } from '@/lib/format';
import { ASSET_TYPE_META, CASH_CATEGORY_META, LOAN_REPAYMENT_TYPE_META, REAL_ESTATE_CATEGORY_META } from '@/lib/palette';
import { useIsDesktop } from '@/lib/responsive';
import type {
  AccountCategory,
  Asset,
  AssetType,
  CashCategory,
  LoanRepaymentType,
  PriceCurrency,
  RealEstateCategory,
} from '@/lib/types';
import { VEHICLE_BRANDS } from '@/lib/vehicleBrands';
import { VEHICLE_MODELS } from '@/lib/vehicleModels';

import { useCreateAsset, useDeleteAsset, useUpdateAsset } from './api';
import { CustodianField } from './CustodianField';
import { StockSymbolAutocomplete } from './StockSymbolAutocomplete';

const ASSET_TYPES = Object.keys(ASSET_TYPE_META) as AssetType[];
const CASH_CATEGORIES = Object.keys(CASH_CATEGORY_META) as CashCategory[];
const REAL_ESTATE_CATEGORIES = Object.keys(REAL_ESTATE_CATEGORY_META) as RealEstateCategory[];

function isLivePriced(type: AssetType) {
  return type === 'STOCK' || type === 'CRYPTO';
}

function isPreciousMetal(type: AssetType) {
  return type === 'GOLD' || type === 'SILVER';
}

type WeightUnit = 'G' | 'DON';
const GRAMS_PER_DON = 3.75;

/** YYYY-MM-DD 문자열에 개월 수를 더한 새 날짜 키를 계산한다(예금/적금 만기일 자동 계산용). */
function addMonthsToDateKey(dateKey: string, months: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1 + months, d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** 시작일~만기일 사이의 개월 수를 대략 계산한다(기존 자산을 수정할 때 예치 기간 입력칸을 채우는 용도). */
function approxMonthsBetweenDateKeys(startKey: string, endKey: string): number {
  const [sy, sm] = startKey.split('-').map(Number);
  const [ey, em] = endKey.split('-').map(Number);
  return Math.max(1, (ey - sy) * 12 + (em - sm));
}

function splitVehicleName(fullName: string): { brand: string; model: string } {
  const brand = VEHICLE_BRANDS.find((b) => fullName.startsWith(`${b} `));
  return brand ? { brand, model: fullName.slice(brand.length + 1) } : { brand: '', model: fullName };
}

/** 원리금균등상환 공식으로 (고정) 월 납입금을 계산한다. 입력값이 유효하지 않으면 null. */
function calculateEqualInstallmentPayment(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
): number | null {
  if (!Number.isFinite(principal) || principal <= 0) return null;
  if (!Number.isFinite(termMonths) || termMonths <= 0) return null;
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) return null;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/** 원금균등상환의 첫 달 납입금(원금/기간 + 첫 달 이자)을 계산한다. 매달 원금 상환액은 고정이지만
 * 이자가 잔액에 비례해 줄어들어 총 납입금은 이 값에서 매달 감소한다. 입력값이 유효하지 않으면 null. */
function calculateEqualPrincipalFirstPayment(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
): number | null {
  if (!Number.isFinite(principal) || principal <= 0) return null;
  if (!Number.isFinite(termMonths) || termMonths <= 0) return null;
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) return null;
  const monthlyPrincipal = principal / termMonths;
  const firstMonthInterest = principal * (annualRatePercent / 100 / 12);
  return monthlyPrincipal + firstMonthInterest;
}

type StockHoldingType = 'SYMBOL' | 'MANUAL';

type StockRow = {
  holdingType: StockHoldingType;
  symbol: string;
  name: string;
  quantity: string;
  averagePrice: string;
  averagePriceCurrency: PriceCurrency;
  manualValue: string;
  accountCategory: AccountCategory;
};

const EMPTY_STOCK_ROW: StockRow = {
  holdingType: 'SYMBOL',
  symbol: '',
  name: '',
  quantity: '',
  averagePrice: '',
  averagePriceCurrency: 'KRW',
  manualValue: '',
  accountCategory: 'GENERAL',
};

export function AssetFormModal({
  visible,
  onClose,
  asset,
}: {
  visible: boolean;
  onClose: () => void;
  asset?: Asset | null;
}) {
  const isEdit = !!asset;
  const isDesktop = useIsDesktop();
  const [type, setType] = useState<AssetType>('REAL_ESTATE');
  const [name, setName] = useState('');
  const [custodian, setCustodian] = useState('');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [averagePriceCurrency, setAveragePriceCurrency] = useState<PriceCurrency>('KRW');
  const [accountCategory, setAccountCategory] = useState<AccountCategory>('GENERAL');
  const [cashCategory, setCashCategory] = useState<CashCategory>('ACCOUNT');
  const [maturityDate, setMaturityDate] = useState<string | null>(null);
  const [cashInterestRate, setCashInterestRate] = useState('');
  const [cashStartDate, setCashStartDate] = useState<string | null>(null);
  const [showCashStartPicker, setShowCashStartPicker] = useState(false);
  const [cashTermMonths, setCashTermMonths] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<string | null>(null);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [encarUrl, setEncarUrl] = useState('');
  const [stockHoldingType, setStockHoldingType] = useState<StockHoldingType>('SYMBOL');
  const [loanPrincipal, setLoanPrincipal] = useState('');
  const [loanStartMonth, setLoanStartMonth] = useState<string | null>(null);
  const [showLoanStartPicker, setShowLoanStartPicker] = useState(false);
  const [loanTermMonths, setLoanTermMonths] = useState('');
  const [loanMonthlyPayment, setLoanMonthlyPayment] = useState('');
  const [loanInterestRate, setLoanInterestRate] = useState('');
  const [loanRepaymentType, setLoanRepaymentType] = useState<LoanRepaymentType>('EQUAL_INSTALLMENT');
  const [manualValue, setManualValue] = useState('');
  const [memo, setMemo] = useState('');
  const [address, setAddress] = useState('');
  const [dong, setDong] = useState('');
  const [ho, setHo] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [customBrand, setCustomBrand] = useState(false);
  const [customModel, setCustomModel] = useState(false);
  const [lawdCd, setLawdCd] = useState<string | null>(null);
  const [dongName, setDongName] = useState<string | null>(null);
  const [complexName, setComplexName] = useState<string | null>(null);
  const [realEstateCategory, setRealEstateCategory] = useState<RealEstateCategory>('OWNED');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('G');
  const [weightInput, setWeightInput] = useState('');
  const [dealDate, setDealDate] = useState<string | null>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [stockRows, setStockRows] = useState<StockRow[]>([EMPTY_STOCK_ROW]);
  const [error, setError] = useState<string | null>(null);

  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const isPending = createAsset.isPending || updateAsset.isPending || deleteAsset.isPending;

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (asset) {
      setType(asset.type);
      setName(asset.name);
      setCustodian(asset.custodian ?? '');
      setSymbol(asset.symbol ?? '');
      setQuantity(asset.quantity != null ? String(asset.quantity) : '');
      setAveragePrice(asset.averagePrice != null ? String(asset.averagePrice) : '');
      setAveragePriceCurrency('KRW');
      setAccountCategory(asset.accountCategory ?? 'GENERAL');
      setCashCategory(asset.cashCategory ?? 'ACCOUNT');
      setMaturityDate(asset.maturityDate);
      setCashInterestRate(asset.cashInterestRate != null ? String(asset.cashInterestRate) : '');
      setCashStartDate(asset.cashStartDate);
      setCashTermMonths(
        asset.cashStartDate && asset.maturityDate
          ? String(approxMonthsBetweenDateKeys(asset.cashStartDate, asset.maturityDate))
          : '',
      );
      setPurchaseDate(asset.purchaseDate);
      setEncarUrl(asset.encarUrl ?? '');
      setStockHoldingType(asset.type === 'STOCK' && !asset.symbol ? 'MANUAL' : 'SYMBOL');
      setLoanPrincipal(asset.loanPrincipal != null ? String(asset.loanPrincipal) : '');
      setLoanStartMonth(asset.loanStartMonth);
      setLoanTermMonths(asset.loanTermMonths != null ? String(asset.loanTermMonths) : '');
      setLoanMonthlyPayment(asset.loanMonthlyPayment != null ? String(asset.loanMonthlyPayment) : '');
      setLoanInterestRate(asset.loanInterestRate != null ? String(asset.loanInterestRate) : '');
      setLoanRepaymentType(asset.loanRepaymentType ?? 'EQUAL_INSTALLMENT');
      setManualValue(asset.manualValue != null ? String(asset.manualValue) : '');
      setMemo(asset.memo ?? '');
      setAddress(asset.address ?? '');
      setDong(asset.dong ?? '');
      setHo(asset.ho ?? '');
      setLawdCd(asset.lawdCd);
      setDongName(asset.regionDongName);
      setComplexName(asset.complexName);
      setRealEstateCategory(asset.realEstateCategory ?? 'OWNED');
      setMonthlyRent(asset.monthlyRent != null ? String(asset.monthlyRent) : '');
      setWeightUnit('G');
      setWeightInput(isPreciousMetal(asset.type) && asset.quantity != null ? String(asset.quantity) : '');
      if (asset.type === 'VEHICLE') {
        const { brand, model } = splitVehicleName(asset.name);
        setVehicleBrand(brand);
        setVehicleModel(model);
        setCustomModel(!VEHICLE_MODELS[brand]?.includes(model));
      } else {
        setVehicleBrand('');
        setVehicleModel('');
        setCustomModel(false);
      }
    } else {
      setType('REAL_ESTATE');
      setName('');
      setCustodian('');
      setSymbol('');
      setQuantity('');
      setAveragePrice('');
      setAveragePriceCurrency('KRW');
      setAccountCategory('GENERAL');
      setCashCategory('ACCOUNT');
      setMaturityDate(null);
      setCashInterestRate('');
      setCashStartDate(null);
      setCashTermMonths('');
      setPurchaseDate(null);
      setEncarUrl('');
      setStockHoldingType('SYMBOL');
      setLoanPrincipal('');
      setLoanStartMonth(null);
      setLoanTermMonths('');
      setLoanMonthlyPayment('');
      setLoanInterestRate('');
      setLoanRepaymentType('EQUAL_INSTALLMENT');
      setManualValue('');
      setMemo('');
      setAddress('');
      setDong('');
      setHo('');
      setVehicleBrand('');
      setVehicleModel('');
      setCustomModel(false);
      setLawdCd(null);
      setDongName(null);
      setComplexName(null);
      setRealEstateCategory('OWNED');
      setMonthlyRent('');
      setWeightUnit('G');
      setWeightInput('');
    }
    setCustomBrand(false);
    setDealDate(null);
    setShowDayPicker(false);
    setShowCashStartPicker(false);
    setShowPurchaseDatePicker(false);
    setShowLoanStartPicker(false);
    setStockRows([EMPTY_STOCK_ROW]);
  }, [visible, asset]);

  // 월 납입금은 직접 입력받지 않고 원금/이율/기간/상환방식으로부터 항상 다시 계산한다 — 넷 중
  // 하나만 바뀌어도 잔액 계산과 어긋나지 않도록. 원금균등은 첫 달 납입금(이후 매달 감소)을 보여준다.
  useEffect(() => {
    if (!visible || type !== 'LOAN') return;
    const principal = Number(loanPrincipal);
    const rate = Number(loanInterestRate);
    const term = Number(loanTermMonths);
    const computed =
      loanRepaymentType === 'EQUAL_PRINCIPAL'
        ? calculateEqualPrincipalFirstPayment(principal, rate, term)
        : calculateEqualInstallmentPayment(principal, rate, term);
    setLoanMonthlyPayment(computed != null ? String(Math.round(computed)) : '');
  }, [visible, type, loanPrincipal, loanInterestRate, loanTermMonths, loanRepaymentType]);

  // 예금/적금 만기일은 직접 고르지 않고 시작일 + 예치 기간(개월)으로부터 항상 다시 계산한다.
  useEffect(() => {
    if (!visible || type !== 'CASH' || cashCategory === 'ACCOUNT') return;
    const months = Number(cashTermMonths);
    if (!cashStartDate || !Number.isFinite(months) || months <= 0) return;
    setMaturityDate(addMonthsToDateKey(cashStartDate, months));
  }, [visible, type, cashCategory, cashStartDate, cashTermMonths]);

  const updateStockRow = (index: number, patch: Partial<StockRow>) => {
    setStockRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const addStockRow = () => setStockRows((rows) => [...rows, EMPTY_STOCK_ROW]);
  const removeStockRow = (index: number) => setStockRows((rows) => rows.filter((_, i) => i !== index));

  const livePriced = isLivePriced(type);
  const bulkStockEntry = !isEdit && livePriced;

  const handleSubmit = async () => {
    setError(null);

    if (bulkStockEntry) {
      const isManualRow = (row: StockRow) => type === 'STOCK' && row.holdingType === 'MANUAL';
      const validRows = stockRows.filter((row) => (isManualRow(row) ? row.name.trim() : row.symbol.trim()));
      if (validRows.length === 0) {
        setError('최소 1개 종목을 입력해주세요.');
        return;
      }
      for (const row of validRows) {
        if (isManualRow(row)) {
          const manualValueNumber = Number(row.manualValue);
          if (!row.manualValue || Number.isNaN(manualValueNumber) || manualValueNumber < 0) {
            setError(`${row.name.trim()}의 평가금액을 올바르게 입력해주세요.`);
            return;
          }
          continue;
        }
        const quantityNumber = Number(row.quantity);
        if (!row.quantity || Number.isNaN(quantityNumber) || quantityNumber <= 0) {
          setError(`${row.symbol.trim()} 종목의 보유 수량을 올바르게 입력해주세요.`);
          return;
        }
      }
      const payloads = validRows.map((row) =>
        isManualRow(row)
          ? {
              type,
              name: row.name.trim(),
              custodian: custodian.trim() || null,
              symbol: null,
              quantity: null,
              averagePrice: null,
              averagePriceCurrency: null,
              manualValue: Number(row.manualValue),
              memo: memo.trim() || null,
              address: null,
              dong: null,
              ho: null,
              lawdCd: null,
              complexName: null,
              regionDongName: null,
              accountCategory: row.accountCategory,
              cashCategory: null,
              maturityDate: null,
              cashInterestRate: null,
              cashStartDate: null,
              purchaseDate: null,
              encarUrl: null,
              loanPrincipal: null,
              loanStartMonth: null,
              loanTermMonths: null,
              loanMonthlyPayment: null,
              loanInterestRate: null,
              loanRepaymentType: null,
              realEstateCategory: null,
              monthlyRent: null,
            }
          : {
              type,
              name: (type === 'STOCK' ? row.name || row.symbol : row.symbol).trim(),
              custodian: custodian.trim() || null,
              symbol: row.symbol.trim().toUpperCase(),
              quantity: Number(row.quantity),
              averagePrice: row.averagePrice.trim() ? Number(row.averagePrice) : null,
              averagePriceCurrency: type === 'STOCK' && row.averagePrice.trim() ? row.averagePriceCurrency : null,
              manualValue: null,
              memo: memo.trim() || null,
              address: null,
              dong: null,
              ho: null,
              lawdCd: null,
              complexName: null,
              regionDongName: null,
              accountCategory: type === 'STOCK' ? row.accountCategory : null,
              cashCategory: null,
              maturityDate: null,
              cashInterestRate: null,
              cashStartDate: null,
              purchaseDate: null,
              encarUrl: null,
              loanPrincipal: null,
              loanStartMonth: null,
              loanTermMonths: null,
              loanMonthlyPayment: null,
              loanInterestRate: null,
              loanRepaymentType: null,
              realEstateCategory: null,
              monthlyRent: null,
            },
      );
      try {
        await Promise.all(payloads.map((payload) => createAsset.mutateAsync(payload)));
        onClose();
      } catch (err) {
        setError(getErrorMessage(err, '추가에 실패했습니다.'));
      }
      return;
    }

    let finalName = name.trim();
    if (type === 'VEHICLE') {
      if (!vehicleBrand.trim()) {
        setError('브랜드를 선택해주세요.');
        return;
      }
      if (!vehicleModel.trim()) {
        setError('모델명을 입력해주세요.');
        return;
      }
      finalName = `${vehicleBrand.trim()} ${vehicleModel.trim()}`;
    } else if (!finalName) {
      setError('이름을 입력해주세요.');
      return;
    }
    const isStockManual = type === 'STOCK' && stockHoldingType === 'MANUAL';
    const effectiveLivePriced = livePriced && !isStockManual;

    if (type === 'LOAN') {
      const principalNumber = Number(loanPrincipal);
      if (!loanPrincipal || Number.isNaN(principalNumber) || principalNumber < 0) {
        setError('대출 원금을 올바르게 입력해주세요.');
        return;
      }
      if (!loanStartMonth) {
        setError('대출 시작년월을 선택해주세요.');
        return;
      }
      const termNumber = Number(loanTermMonths);
      if (!loanTermMonths || Number.isNaN(termNumber) || termNumber <= 0) {
        setError('상환 기한을 올바르게 입력해주세요.');
        return;
      }
      const interestRateNumber = Number(loanInterestRate);
      if (loanInterestRate.trim() === '' || Number.isNaN(interestRateNumber) || interestRateNumber < 0) {
        setError('이율을 올바르게 입력해주세요.');
        return;
      }
      const monthlyPaymentNumber = Number(loanMonthlyPayment);
      if (!loanMonthlyPayment || Number.isNaN(monthlyPaymentNumber) || monthlyPaymentNumber < 0) {
        setError('월 납입금을 계산하지 못했어요. 원금·이율·상환 기한을 다시 확인해주세요.');
        return;
      }
    } else if (effectiveLivePriced) {
      if (!symbol.trim()) {
        setError('심볼(티커)을 입력해주세요.');
        return;
      }
      const quantityNumber = Number(quantity);
      if (!quantity || Number.isNaN(quantityNumber) || quantityNumber <= 0) {
        setError('보유 수량을 올바르게 입력해주세요.');
        return;
      }
    } else if (isPreciousMetal(type)) {
      const weightNumber = Number(weightInput);
      if (!weightInput || Number.isNaN(weightNumber) || weightNumber <= 0) {
        setError('중량을 올바르게 입력해주세요.');
        return;
      }
    } else {
      const manualValueNumber = Number(manualValue);
      if (!manualValue || Number.isNaN(manualValueNumber) || manualValueNumber < 0) {
        setError(
          type === 'REAL_ESTATE' ? `${REAL_ESTATE_CATEGORY_META[realEstateCategory].valueLabel}을 올바르게 입력해주세요.` : '평가금액을 올바르게 입력해주세요.',
        );
        return;
      }
      if (type === 'REAL_ESTATE' && realEstateCategory === 'WOLSE') {
        const monthlyRentNumber = Number(monthlyRent);
        if (!monthlyRent || Number.isNaN(monthlyRentNumber) || monthlyRentNumber < 0) {
          setError('월세를 올바르게 입력해주세요.');
          return;
        }
      }
    }

    const preciousMetalGrams = isPreciousMetal(type)
      ? weightUnit === 'DON'
        ? Number(weightInput) * GRAMS_PER_DON
        : Number(weightInput)
      : null;

    const payload = {
      type,
      name: finalName,
      custodian: custodian.trim() || null,
      symbol: effectiveLivePriced ? symbol.trim().toUpperCase() : null,
      quantity: effectiveLivePriced ? Number(quantity) : preciousMetalGrams,
      averagePrice: effectiveLivePriced && averagePrice.trim() ? Number(averagePrice) : null,
      averagePriceCurrency: type === 'STOCK' && !isStockManual && averagePrice.trim() ? averagePriceCurrency : null,
      manualValue: effectiveLivePriced || type === 'LOAN' || isPreciousMetal(type) ? null : Number(manualValue),
      memo: memo.trim() || null,
      address: address.trim() || null,
      dong: dong.trim() || null,
      ho: ho.trim() || null,
      lawdCd: type === 'REAL_ESTATE' ? lawdCd : null,
      complexName: type === 'REAL_ESTATE' ? complexName : null,
      regionDongName: type === 'REAL_ESTATE' ? dongName : null,
      accountCategory: type === 'STOCK' ? accountCategory : null,
      cashCategory: type === 'CASH' ? cashCategory : null,
      maturityDate: type === 'CASH' && cashCategory !== 'ACCOUNT' ? maturityDate : null,
      cashInterestRate:
        type === 'CASH' && cashCategory !== 'ACCOUNT' && cashInterestRate.trim() ? Number(cashInterestRate) : null,
      cashStartDate: type === 'CASH' && cashCategory !== 'ACCOUNT' ? cashStartDate : null,
      purchaseDate: type === 'VEHICLE' ? purchaseDate : null,
      encarUrl: type === 'VEHICLE' ? encarUrl.trim() || null : null,
      loanPrincipal: type === 'LOAN' ? Number(loanPrincipal) : null,
      loanStartMonth: type === 'LOAN' ? loanStartMonth : null,
      loanTermMonths: type === 'LOAN' ? Number(loanTermMonths) : null,
      loanMonthlyPayment: type === 'LOAN' ? Number(loanMonthlyPayment) : null,
      loanInterestRate: type === 'LOAN' ? Number(loanInterestRate) : null,
      loanRepaymentType: type === 'LOAN' ? loanRepaymentType : null,
      realEstateCategory: type === 'REAL_ESTATE' ? realEstateCategory : null,
      monthlyRent: type === 'REAL_ESTATE' && realEstateCategory === 'WOLSE' ? Number(monthlyRent) : null,
    };

    if (isEdit && asset) {
      updateAsset.mutate(
        { id: asset.id, data: payload },
        { onSuccess: onClose, onError: (err) => setError(getErrorMessage(err, '수정에 실패했습니다.')) },
      );
    } else {
      createAsset.mutate(payload, {
        onSuccess: onClose,
        onError: (err) => setError(getErrorMessage(err, '추가에 실패했습니다.')),
      });
    }
  };

  const handleDelete = () => {
    if (!asset) return;
    deleteAsset.mutate(asset.id, {
      onSuccess: onClose,
      onError: (err) => setError(getErrorMessage(err, '삭제에 실패했습니다.')),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className={`flex-1 bg-black/40 ${isDesktop ? 'items-center justify-center' : 'justify-end'}`}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={`max-h-[85%] gap-4 bg-white p-5 dark:bg-slate-900 ${
            isDesktop ? 'w-full max-w-[560px] rounded-3xl' : 'rounded-t-3xl'
          }`}>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {isEdit ? '자산 수정' : '자산 추가'}
          </Text>

          <ScrollView className="max-h-[65%]" keyboardShouldPersistTaps="handled">
            <View className="gap-4">
              <View className="flex-row flex-wrap gap-2">
                {ASSET_TYPES.map((option) => (
                  <Chip
                    key={option}
                    label={ASSET_TYPE_META[option].label}
                    icon={ASSET_TYPE_META[option].icon}
                    selected={type === option}
                    onPress={() => setType(option)}
                  />
                ))}
              </View>

              {type === 'VEHICLE' ? (
                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">브랜드</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {VEHICLE_BRANDS.map((brand) => (
                      <Chip
                        key={brand}
                        label={brand}
                        selected={!customBrand && vehicleBrand === brand}
                        onPress={() => {
                          setVehicleBrand(brand);
                          setCustomBrand(false);
                          setVehicleModel('');
                          setCustomModel(false);
                        }}
                      />
                    ))}
                    <Chip
                      label="기타"
                      selected={customBrand}
                      onPress={() => {
                        setCustomBrand(true);
                        setVehicleBrand('');
                        setVehicleModel('');
                        setCustomModel(false);
                      }}
                    />
                  </View>
                  {customBrand ? (
                    <TextField
                      label="브랜드 직접입력"
                      value={vehicleBrand}
                      onChangeText={setVehicleBrand}
                      placeholder="브랜드명을 입력하세요"
                    />
                  ) : null}

                  {!customBrand && VEHICLE_MODELS[vehicleBrand] ? (
                    <View className="gap-1.5">
                      <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">모델명</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {VEHICLE_MODELS[vehicleBrand].map((model) => (
                          <Chip
                            key={model}
                            label={model}
                            selected={!customModel && vehicleModel === model}
                            onPress={() => {
                              setVehicleModel(model);
                              setCustomModel(false);
                            }}
                          />
                        ))}
                        <Chip
                          label="기타"
                          selected={customModel}
                          onPress={() => {
                            setCustomModel(true);
                            setVehicleModel('');
                          }}
                        />
                      </View>
                      {customModel ? (
                        <TextField
                          label="모델명 직접입력"
                          value={vehicleModel}
                          onChangeText={setVehicleModel}
                          placeholder="모델명을 입력하세요"
                        />
                      ) : null}
                    </View>
                  ) : (
                    <TextField
                      label="모델명"
                      value={vehicleModel}
                      onChangeText={setVehicleModel}
                      placeholder="예) 아반떼, 그랜저"
                    />
                  )}

                  <View className="gap-1.5">
                    <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">구매일 (선택)</Text>
                    <View className="flex-row items-center gap-2">
                      <Pressable
                        onPress={() => setShowPurchaseDatePicker(true)}
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-800">
                        <Text className={purchaseDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                          {purchaseDate ?? '구매일을 선택하세요'}
                        </Text>
                      </Pressable>
                      {purchaseDate ? (
                        <Pressable onPress={() => setPurchaseDate(null)} className="px-2 py-3">
                          <Text className="text-xs font-medium text-slate-400">지우기</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                  <DayPickerModal
                    visible={showPurchaseDatePicker}
                    onClose={() => setShowPurchaseDatePicker(false)}
                    onSelectDate={setPurchaseDate}
                    initialDateKey={purchaseDate ?? undefined}
                  />

                  <TextField
                    label="엔카 매물 목록 URL (선택)"
                    value={encarUrl}
                    onChangeText={setEncarUrl}
                    placeholder="car.encar.com에서 같은 차종으로 검색한 목록 URL을 붙여넣으세요"
                  />
                  <Text className="text-xs text-slate-400">
                    새로고침할 때마다 이 URL의 매물 목록에서 가격을 가져와 평균값을 현재가로 써요. 비워두면
                    구매가를 그대로 현재가로 써요.
                  </Text>
                </View>
              ) : bulkStockEntry ? null : (
                <TextField
                  label="이름"
                  value={name}
                  onChangeText={setName}
                  placeholder={
                    livePriced
                      ? '예) 삼성전자'
                      : type === 'GOLD'
                        ? '예) 골드바'
                        : type === 'SILVER'
                          ? '예) 실버바'
                          : '예) 우리집'
                  }
                />
              )}

              {type !== 'REAL_ESTATE' && type !== 'VEHICLE' ? (
                <CustodianField value={custodian} onChangeText={setCustodian} />
              ) : null}

              {type === 'CASH' ? (
                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">현금 종류</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {CASH_CATEGORIES.map((option) => (
                      <Chip
                        key={option}
                        label={CASH_CATEGORY_META[option].label}
                        selected={cashCategory === option}
                        onPress={() => setCashCategory(option)}
                      />
                    ))}
                  </View>
                  {cashCategory !== 'ACCOUNT' ? (
                    <>
                      <View className="gap-1.5">
                        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">시작일 (선택)</Text>
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            onPress={() => setShowCashStartPicker(true)}
                            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-800">
                            <Text className={cashStartDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                              {cashStartDate ?? '예치 시작일을 선택하세요'}
                            </Text>
                          </Pressable>
                          {cashStartDate ? (
                            <Pressable onPress={() => setCashStartDate(null)} className="px-2 py-3">
                              <Text className="text-xs font-medium text-slate-400">지우기</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                      <DayPickerModal
                        visible={showCashStartPicker}
                        onClose={() => setShowCashStartPicker(false)}
                        onSelectDate={setCashStartDate}
                        initialDateKey={cashStartDate ?? undefined}
                        yearRangeFuture={10}
                      />
                      <TextField
                        label="예치 기간 (개월, 선택)"
                        value={cashTermMonths}
                        onChangeText={(text) => setCashTermMonths(text.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="예) 12"
                      />
                      <TextField
                        label="이율 (연 %, 선택)"
                        value={cashInterestRate}
                        onChangeText={(text) => setCashInterestRate(text.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                        placeholder="예) 3.5"
                      />
                      <View className="gap-1.5 opacity-70">
                        <TextField label="만기일 (자동 계산)" value={maturityDate ?? ''} editable={false} placeholder="시작일과 기간을 입력하면 계산돼요" />
                      </View>
                      <Text className="text-xs text-slate-400">
                        시작일·이율·기간을 모두 입력하면 단리 기준으로 오늘까지 늘어난 이자와 만기 예상 수령액을
                        보여드려요.
                      </Text>
                    </>
                  ) : null}
                </View>
              ) : null}

              {type === 'REAL_ESTATE' ? (
                <>
                  <View className="gap-1.5">
                    <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">보유 형태</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {REAL_ESTATE_CATEGORIES.map((option) => (
                        <Chip
                          key={option}
                          label={REAL_ESTATE_CATEGORY_META[option].label}
                          selected={realEstateCategory === option}
                          onPress={() => setRealEstateCategory(option)}
                        />
                      ))}
                    </View>
                  </View>

                  <AddressAutocomplete
                    value={address}
                    onChangeText={(text) => {
                      setAddress(text);
                      setLawdCd(null);
                      setDongName(null);
                      setComplexName(null);
                    }}
                    onSelect={(candidate) => {
                      setLawdCd(candidate.lawdCd);
                      setDongName(candidate.dongName);
                      setComplexName(candidate.buildingName);
                    }}
                  />
                  {realEstateCategory === 'OWNED' && lawdCd && complexName ? (
                    <Text className="text-xs text-slate-400">
                      &quot;{complexName}&quot; 단지의 국토부 실거래가로 시세를 자동 갱신해요.
                    </Text>
                  ) : realEstateCategory === 'OWNED' && lawdCd ? (
                    <Text className="text-xs text-slate-400">
                      단지명이 없는 주소는 실거래가를 자동으로 조회할 수 없어요. 평가금액을 직접 입력해주세요.
                    </Text>
                  ) : null}
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <TextField
                        label="동 (선택)"
                        value={dong}
                        onChangeText={(text) => setDong(text.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="101"
                      />
                    </View>
                    <View className="flex-1">
                      <TextField
                        label="호수 (선택)"
                        value={ho}
                        onChangeText={(text) => setHo(text.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="1502"
                      />
                    </View>
                  </View>

                  {realEstateCategory === 'OWNED' ? (
                    <>
                      <View className="gap-1.5">
                        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">매매일 (선택)</Text>
                        <Pressable
                          onPress={() => setShowDayPicker(true)}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-800">
                          <Text className={dealDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                            {dealDate ?? '매매일을 선택하면 실거래가를 자동으로 조회해요'}
                          </Text>
                        </Pressable>
                        {!lawdCd && dealDate ? (
                          <Text className="text-xs text-slate-400">
                            주소를 목록에서 선택해야 실거래가를 조회할 수 있어요.
                          </Text>
                        ) : null}
                      </View>

                      {lawdCd && dealDate ? (
                        <RealEstateTradeLookup
                          lawdCd={lawdCd}
                          dongName={dongName}
                          complexName={complexName}
                          unitDong={dong || null}
                          unitHo={ho || null}
                          dealDate={dealDate}
                          onSelectAmount={(amount) => setManualValue(String(amount))}
                        />
                      ) : null}

                      <DayPickerModal
                        visible={showDayPicker}
                        onClose={() => setShowDayPicker(false)}
                        onSelectDate={setDealDate}
                        initialDateKey={dealDate ?? undefined}
                      />
                    </>
                  ) : null}
                </>
              ) : null}

              {bulkStockEntry ? (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {custodian.trim() ? `${custodian.trim()}에 보유한 종목` : '보유 종목'}
                  </Text>
                  {stockRows.map((row, index) => (
                    <View key={index} className="gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      {type === 'STOCK' ? (
                        <View className="flex-row gap-2">
                          <Chip
                            label="종목 보유"
                            selected={row.holdingType === 'SYMBOL'}
                            onPress={() => updateStockRow(index, { holdingType: 'SYMBOL' })}
                          />
                          <Chip
                            label="현금·보장형 상품"
                            selected={row.holdingType === 'MANUAL'}
                            onPress={() => updateStockRow(index, { holdingType: 'MANUAL' })}
                          />
                        </View>
                      ) : null}
                      {type === 'STOCK' && row.holdingType === 'MANUAL' ? (
                        <>
                          <TextField
                            label="이름"
                            value={row.name}
                            onChangeText={(text) => updateStockRow(index, { name: text })}
                            placeholder="예) 현금 잔고, 원리금보장형 상품"
                          />
                          <TextField
                            label="평가금액"
                            value={formatAmountInput(row.manualValue)}
                            onChangeText={(text) => updateStockRow(index, { manualValue: text.replace(/[^0-9]/g, '') })}
                            keyboardType="numeric"
                            placeholder="0"
                          />
                        </>
                      ) : (
                        <>
                          {type === 'STOCK' ? (
                            <StockSymbolAutocomplete
                              value={row.symbol}
                              onChangeText={(text) => updateStockRow(index, { symbol: text })}
                              onSelect={(candidate) =>
                                updateStockRow(index, { symbol: candidate.symbol, name: candidate.name })
                              }
                            />
                          ) : (
                            <TextField
                              label="심볼(티커)"
                              value={row.symbol}
                              onChangeText={(text) => updateStockRow(index, { symbol: text.toUpperCase() })}
                              autoCapitalize="characters"
                              placeholder="BTC, ETH..."
                            />
                          )}
                          <View className="flex-row gap-2">
                            <View className="flex-1">
                              <TextField
                                label="보유 수량"
                                value={row.quantity}
                                onChangeText={(text) => updateStockRow(index, { quantity: text })}
                                keyboardType="decimal-pad"
                                placeholder="0"
                              />
                            </View>
                            <View className="flex-1">
                              <TextField
                                label="평단가 (선택)"
                                value={formatDecimalAmountInput(row.averagePrice)}
                                onChangeText={(text) => {
                                  const cleaned = text.replace(/[^0-9.]/g, '');
                                  const [intPart, ...rest] = cleaned.split('.');
                                  updateStockRow(index, {
                                    averagePrice: rest.length > 0 ? `${intPart}.${rest.join('')}` : intPart,
                                  });
                                }}
                                keyboardType="decimal-pad"
                                placeholder="매수 평균 단가"
                              />
                            </View>
                          </View>
                          {type === 'STOCK' ? (
                            <View className="flex-row gap-2">
                              <Chip
                                label="원화"
                                selected={row.averagePriceCurrency === 'KRW'}
                                onPress={() => updateStockRow(index, { averagePriceCurrency: 'KRW' })}
                              />
                              <Chip
                                label="달러"
                                selected={row.averagePriceCurrency === 'USD'}
                                onPress={() => updateStockRow(index, { averagePriceCurrency: 'USD' })}
                              />
                            </View>
                          ) : null}
                        </>
                      )}
                      {type === 'STOCK' ? (
                        <View className="flex-row gap-2">
                          <Chip
                            label="일반"
                            selected={row.accountCategory === 'GENERAL'}
                            onPress={() => updateStockRow(index, { accountCategory: 'GENERAL' })}
                          />
                          <Chip
                            label="연금"
                            selected={row.accountCategory === 'PENSION'}
                            onPress={() => updateStockRow(index, { accountCategory: 'PENSION' })}
                          />
                        </View>
                      ) : null}
                      {stockRows.length > 1 ? (
                        <Pressable onPress={() => removeStockRow(index)} className="self-end">
                          <Text className="text-xs font-medium text-red-500">삭제</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                  <Pressable
                    onPress={addStockRow}
                    className="items-center rounded-xl border border-dashed border-primary py-2.5">
                    <Text className="text-sm font-medium text-primary">+ 종목 추가</Text>
                  </Pressable>
                  <Text className="text-xs text-slate-400">
                    현재가는 저장 후 "새로고침"을 누르면 실시간으로 조회돼요.
                  </Text>
                </View>
              ) : livePriced ? (
                <>
                  {type === 'STOCK' ? (
                    <View className="flex-row gap-2">
                      <Chip
                        label="종목 보유"
                        selected={stockHoldingType === 'SYMBOL'}
                        onPress={() => setStockHoldingType('SYMBOL')}
                      />
                      <Chip
                        label="현금·보장형 상품"
                        selected={stockHoldingType === 'MANUAL'}
                        onPress={() => setStockHoldingType('MANUAL')}
                      />
                    </View>
                  ) : null}
                  {type === 'STOCK' && stockHoldingType === 'MANUAL' ? (
                    <TextField
                      label="평가금액"
                      value={formatAmountInput(manualValue)}
                      onChangeText={(text) => setManualValue(text.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  ) : (
                    <>
                      {type === 'STOCK' ? (
                        <StockSymbolAutocomplete
                          value={symbol}
                          onChangeText={setSymbol}
                          onSelect={(candidate) => {
                            setSymbol(candidate.symbol);
                            if (!name.trim()) setName(candidate.name);
                          }}
                        />
                      ) : (
                        <TextField
                          label="심볼(티커)"
                          value={symbol}
                          onChangeText={setSymbol}
                          autoCapitalize="characters"
                          placeholder="BTC, ETH..."
                        />
                      )}
                      <TextField
                        label="보유 수량"
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="decimal-pad"
                        placeholder="0"
                      />
                      <TextField
                        label="평단가 (선택)"
                        value={formatDecimalAmountInput(averagePrice)}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/[^0-9.]/g, '');
                          const [intPart, ...rest] = cleaned.split('.');
                          setAveragePrice(rest.length > 0 ? `${intPart}.${rest.join('')}` : intPart);
                        }}
                        keyboardType="decimal-pad"
                        placeholder="매수 평균 단가"
                      />
                      {type === 'STOCK' ? (
                        <View className="flex-row gap-2">
                          <Chip
                            label="원화"
                            selected={averagePriceCurrency === 'KRW'}
                            onPress={() => setAveragePriceCurrency('KRW')}
                          />
                          <Chip
                            label="달러"
                            selected={averagePriceCurrency === 'USD'}
                            onPress={() => setAveragePriceCurrency('USD')}
                          />
                        </View>
                      ) : null}
                    </>
                  )}
                  {type === 'STOCK' ? (
                    <View className="flex-row gap-2">
                      <Chip
                        label="일반"
                        selected={accountCategory === 'GENERAL'}
                        onPress={() => setAccountCategory('GENERAL')}
                      />
                      <Chip
                        label="연금"
                        selected={accountCategory === 'PENSION'}
                        onPress={() => setAccountCategory('PENSION')}
                      />
                    </View>
                  ) : null}
                  {stockHoldingType === 'SYMBOL' ? (
                    <Text className="text-xs text-slate-400">
                      현재가는 저장 후 "새로고침"을 누르면 실시간으로 조회돼요.
                    </Text>
                  ) : null}
                </>
              ) : type === 'LOAN' ? (
                <>
                  <TextField
                    label="원금"
                    value={formatAmountInput(loanPrincipal)}
                    onChangeText={(text) => setLoanPrincipal(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <View className="gap-1.5">
                    <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">시작년월</Text>
                    <Pressable
                      onPress={() => setShowLoanStartPicker(true)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-800">
                      <Text className={loanStartMonth ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                        {loanStartMonth ?? '대출 시작년월을 선택하세요'}
                      </Text>
                    </Pressable>
                  </View>
                  <DayPickerModal
                    visible={showLoanStartPicker}
                    onClose={() => setShowLoanStartPicker(false)}
                    onSelectDate={setLoanStartMonth}
                    initialDateKey={loanStartMonth ?? undefined}
                  />
                  <TextField
                    label="상환 기한 (개월)"
                    value={loanTermMonths}
                    onChangeText={(text) => setLoanTermMonths(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="예) 360"
                  />
                  <TextField
                    label="이율 (연 %)"
                    value={loanInterestRate}
                    onChangeText={(text) => setLoanInterestRate(text.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="예) 4.5"
                  />
                  <View className="gap-1.5">
                    <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">상환 방식</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {(Object.keys(LOAN_REPAYMENT_TYPE_META) as LoanRepaymentType[]).map((repaymentType) => (
                        <Chip
                          key={repaymentType}
                          label={LOAN_REPAYMENT_TYPE_META[repaymentType].label}
                          selected={loanRepaymentType === repaymentType}
                          onPress={() => setLoanRepaymentType(repaymentType)}
                        />
                      ))}
                    </View>
                  </View>
                  <View className="gap-1.5 opacity-70">
                    <TextField
                      label={
                        loanRepaymentType === 'EQUAL_PRINCIPAL' ? '월 납입금 (첫 달, 자동 계산)' : '월 납입금 (자동 계산)'
                      }
                      value={loanMonthlyPayment ? `${formatAmountInput(loanMonthlyPayment)}원` : ''}
                      editable={false}
                      placeholder="원금·이율·상환 기한을 입력하면 계산돼요"
                    />
                  </View>
                  <Text className="text-xs text-slate-400">
                    {loanRepaymentType === 'EQUAL_PRINCIPAL'
                      ? '매달 원금 상환액은 고정이고 이자가 잔액에 비례해 줄어들어, 총 납입금이 매달 조금씩 줄어요. 잔액도 그 기준(선형 감소)으로 보여드려요.'
                      : '원금·이율·상환 기한으로 원리금균등분할상환 월 납입금을 자동 계산해요. 매달 잔액이 그 기준으로 줄어드는 추정 잔액을 보여드려요.'}
                  </Text>
                </>
              ) : isPreciousMetal(type) ? (
                <>
                  <View className="flex-row gap-2">
                    <Chip label="g" selected={weightUnit === 'G'} onPress={() => setWeightUnit('G')} />
                    <Chip label="돈" selected={weightUnit === 'DON'} onPress={() => setWeightUnit('DON')} />
                  </View>
                  <TextField
                    label="중량"
                    value={weightInput}
                    onChangeText={(text) => setWeightInput(text.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder={weightUnit === 'DON' ? '예) 1' : '예) 3.75'}
                  />
                  <Text className="text-xs text-slate-400">
                    국제 시세(트로이온스) 기준으로 환산한 참고 가격이에요 — 국내 금은방 매매가와는 차이가 있을 수
                    있어요. 현재가는 저장 후 &quot;새로고침&quot;을 누르면 실시간으로 조회돼요.
                  </Text>
                </>
              ) : (
                <>
                  <TextField
                    label={
                      type === 'VEHICLE'
                        ? '구매 가격'
                        : type === 'REAL_ESTATE'
                          ? REAL_ESTATE_CATEGORY_META[realEstateCategory].valueLabel
                          : '평가금액'
                    }
                    value={formatAmountInput(manualValue)}
                    onChangeText={(text) => setManualValue(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  {type === 'REAL_ESTATE' && realEstateCategory === 'WOLSE' ? (
                    <TextField
                      label="월세"
                      value={formatAmountInput(monthlyRent)}
                      onChangeText={(text) => setMonthlyRent(text.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  ) : null}
                  {type === 'VEHICLE' && purchaseDate ? (
                    <Text className="text-xs text-slate-400">
                      1년차 -25%, 이후 매년 -12%씩 감가상각한 추정 시세를 자동으로 계산해요(공식 시세는
                      아니에요).
                    </Text>
                  ) : null}
                </>
              )}

              <TextField label="메모 (선택)" value={memo} onChangeText={setMemo} placeholder="메모를 입력하세요" />
            </View>
          </ScrollView>

          {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}

          <View className="gap-2">
            <Button title={isEdit ? '수정하기' : '추가하기'} onPress={handleSubmit} loading={isPending} />
            {isEdit ? <Button title="삭제하기" variant="danger" onPress={handleDelete} loading={isPending} /> : null}
            <Button title="취소" variant="secondary" onPress={onClose} disabled={isPending} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
