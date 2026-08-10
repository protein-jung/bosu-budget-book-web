import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { DayPickerModal } from '@/components/DayPickerModal';
import { TextField } from '@/components/TextField';
import { AddressAutocomplete } from '@/features/realEstate/AddressAutocomplete';
import { RealEstateTradeLookup } from '@/features/realEstate/RealEstateTradeLookup';
import { getErrorMessage } from '@/lib/apiClient';
import { ASSET_TYPE_META } from '@/lib/palette';
import type { Asset, AssetType } from '@/lib/types';
import { VEHICLE_BRANDS } from '@/lib/vehicleBrands';
import { VEHICLE_MODELS } from '@/lib/vehicleModels';

import { useCreateAsset, useDeleteAsset, useUpdateAsset } from './api';
import { StockSymbolAutocomplete } from './StockSymbolAutocomplete';

const ASSET_TYPES = Object.keys(ASSET_TYPE_META) as AssetType[];

function isLivePriced(type: AssetType) {
  return type === 'STOCK' || type === 'CRYPTO';
}

function splitVehicleName(fullName: string): { brand: string; model: string } {
  const brand = VEHICLE_BRANDS.find((b) => fullName.startsWith(`${b} `));
  return brand ? { brand, model: fullName.slice(brand.length + 1) } : { brand: '', model: fullName };
}

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
  const [type, setType] = useState<AssetType>('REAL_ESTATE');
  const [name, setName] = useState('');
  const [custodian, setCustodian] = useState('');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
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
  const [dealDate, setDealDate] = useState<string | null>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
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
      setManualValue(asset.manualValue != null ? String(asset.manualValue) : '');
      setMemo(asset.memo ?? '');
      setAddress(asset.address ?? '');
      setDong(asset.dong ?? '');
      setHo(asset.ho ?? '');
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
      setManualValue('');
      setMemo('');
      setAddress('');
      setDong('');
      setHo('');
      setVehicleBrand('');
      setVehicleModel('');
      setCustomModel(false);
    }
    setCustomBrand(false);
    setLawdCd(null);
    setDongName(null);
    setComplexName(null);
    setDealDate(null);
    setShowDayPicker(false);
  }, [visible, asset]);

  const livePriced = isLivePriced(type);

  const handleSubmit = () => {
    setError(null);
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
    if (livePriced) {
      if (!symbol.trim()) {
        setError('심볼(티커)을 입력해주세요.');
        return;
      }
      const quantityNumber = Number(quantity);
      if (!quantity || Number.isNaN(quantityNumber) || quantityNumber <= 0) {
        setError('보유 수량을 올바르게 입력해주세요.');
        return;
      }
    } else {
      const manualValueNumber = Number(manualValue);
      if (!manualValue || Number.isNaN(manualValueNumber) || manualValueNumber < 0) {
        setError('평가금액을 올바르게 입력해주세요.');
        return;
      }
    }

    const payload = {
      type,
      name: finalName,
      custodian: custodian.trim() || null,
      symbol: livePriced ? symbol.trim().toUpperCase() : null,
      quantity: livePriced ? Number(quantity) : null,
      averagePrice: livePriced && averagePrice.trim() ? Number(averagePrice) : null,
      manualValue: livePriced ? null : Number(manualValue),
      memo: memo.trim() || null,
      address: address.trim() || null,
      dong: dong.trim() || null,
      ho: ho.trim() || null,
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
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[85%] gap-4 rounded-t-3xl bg-white p-5 dark:bg-slate-900">
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
                </View>
              ) : (
                <TextField
                  label="이름"
                  value={name}
                  onChangeText={setName}
                  placeholder={livePriced ? '예) 삼성전자' : '예) 우리집'}
                />
              )}

              {type !== 'REAL_ESTATE' && type !== 'VEHICLE' ? (
                <TextField
                  label="보관처 (선택)"
                  value={custodian}
                  onChangeText={setCustodian}
                  placeholder="예) 미래에셋증권, 업비트, ○○은행"
                />
              ) : null}

              {type === 'REAL_ESTATE' ? (
                <>
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

              {livePriced ? (
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
                    value={averagePrice}
                    onChangeText={setAveragePrice}
                    keyboardType="decimal-pad"
                    placeholder="매수 평균 단가"
                  />
                  <Text className="text-xs text-slate-400">
                    현재가는 저장 후 "새로고침"을 누르면 실시간으로 조회돼요.
                  </Text>
                </>
              ) : (
                <TextField
                  label="평가금액"
                  value={manualValue}
                  onChangeText={setManualValue}
                  keyboardType="numeric"
                  placeholder="0"
                />
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
        </View>
      </View>
    </Modal>
  );
}
