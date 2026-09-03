import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View className="gap-1.5">
      <Text className="text-base font-semibold text-slate-900">{title}</Text>
      <Text className="text-sm leading-6 text-slate-600">{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  return (
    <Screen backgroundClassName="bg-white">
      <View className="gap-1">
        <Pressable onPress={() => router.back()} className="mb-1 self-start">
          <Text className="text-sm font-medium text-primary">‹ 뒤로</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-slate-900">개인정보처리방침</Text>
        <Text className="text-sm text-slate-400">시행일: 2026년 9월 3일</Text>
      </View>

      <View className="gap-5">
        <Section title="1. 수집하는 정보">
          회원가입 시 이름, 이메일, 생년월일, 비밀번호(암호화되어 저장)를 수집해요. 이후
          이용자가 직접 입력하는 거래 내역, 자산 정보, 카드·카테고리 이름, 기능 요청 문의
          내용도 가계부 데이터로 저장돼요.
        </Section>
        <Section title="2. 이용 목적">
          로그인 인증, 가계부 기능 제공(수입·지출 기록, 통계, 예산, 자산 관리), 기능 요청에
          답변이 달렸을 때 알림 메일 발송에만 써요. 광고나 마케팅에 이용하지 않아요.
        </Section>
        <Section title="3. 보유 및 이용 기간">
          회원 탈퇴 전까지 보관하고, 탈퇴하면 이름·이메일·비밀번호 등 계정 정보는 즉시
          삭제해요. 다만 배우자와 함께 쓰는 가계부의 거래 내역·자산 정보는 가계부 자체의
          공유 데이터이기 때문에, 탈퇴 후에도 가계부에는 남아있을 수 있고 이 경우 작성자
          표시만 사라져요. 관련 법령에 따라 별도 보관 의무가 생기는 경우 그 기간 동안만
          예외적으로 보관해요.
        </Section>
        <Section title="4. 외부 서비스 연동">
          {`이용자가 직접 요청하는 경우에 한해 아래 외부 서비스를 호출해요. 이때 조회에 필요한 값(주소, 종목 코드, 차량 정보 등)만 전달되고, 이름·이메일 등 개인정보는 전달되지 않아요.

· 부동산 실거래가 조회 — 국토교통부 API
· 주소 검색 — 카카오 API
· 차량 시세 조회 — 엔카(encar)
· 주식 시세 조회 — 야후 파이낸스
· 코인 시세 조회 — CoinGecko`}
        </Section>
        <Section title="5. 개인정보 처리 위탁 및 국외 이전">
          서버 인프라는 Amazon Web Services(AWS) 서울 리전(국내)에서 운영하고 있어 개인정보를
          국외로 이전하지 않아요. 이메일 발송이 필요해 별도 이메일 발송 서비스를 이용하게
          되면, 위탁 업체와 위탁 범위를 이 방침에 추가로 안내할게요.
        </Section>
        <Section title="6. 제3자 제공">
          위에 적은 경우를 빼면, 수집한 정보를 다른 곳에 제공하거나 판매하지 않아요.
        </Section>
        <Section title="7. 안전성 확보조치">
          비밀번호는 암호화하여 저장하고, 모든 통신 구간은 HTTPS로 암호화해요. 가계부 데이터는
          같은 가계부 구성원만 조회할 수 있도록 접근 권한을 제한하고 있어요.
        </Section>
        <Section title="8. 이용자의 권리">
          앱 내 설정 화면에서 언제든 본인의 계정 정보를 확인·수정할 수 있고, 계정 삭제(탈퇴)를
          요청하면 위 3번 항목에 따라 계정 정보를 삭제해드려요. 그 외 개인정보 관련 문의는
          아래 개인정보 보호책임자에게 이메일로 연락해주세요.
        </Section>
        <Section title="9. 개인정보 보호책임자">
          {`이 서비스는 1인 운영으로 별도 사업자 등록 없이 제공돼요. 개인정보 관련 문의·불만 처리는 아래로 연락해주세요.

이메일: doslxk@gmail.com`}
        </Section>
        <Section title="10. 방침의 변경">
          이 방침의 내용이 바뀌면 시행일을 갱신하고, 앱 내 공지를 통해 미리 알려드릴게요.
        </Section>
      </View>
    </Screen>
  );
}
