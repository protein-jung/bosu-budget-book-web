import { Link, router } from 'expo-router';
import Head from 'expo-router/head';
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
    <>
      <Head>
        <title>개인정보처리방침 | 보수가계부 (BOSU Ledger)</title>
        <meta name="description" content="보수가계부(BOSU Ledger)가 개인정보를 어떻게 수집·이용·보관하는지 안내합니다." />
      </Head>
      <Screen backgroundClassName="bg-white">
      <View className="gap-1">
        <Pressable onPress={() => router.back()} className="mb-1 self-start">
          <Text className="text-sm font-medium text-primary">‹ 뒤로</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-slate-900">개인정보처리방침</Text>
        <Text className="text-sm text-slate-400">시행일: 2026년 9월 9일 (이전 버전: 2026년 9월 3일)</Text>
      </View>

      <View className="gap-5">
        <Text className="text-sm leading-6 text-slate-600">
          운영자는 「개인정보 보호법」 제30조에 따라 이용자의 개인정보를 보호하고 관련 고충을
          신속·원활하게 처리하기 위해 이 개인정보처리방침을 수립·공개해요.
        </Text>
        <Section title="1. 수집하는 정보">
          회원가입 시 이름, 이메일, 생년월일, 비밀번호(암호화되어 저장)를 수집해요. 이후
          이용자가 직접 입력하는 거래 내역, 자산 정보, 카드·카테고리 이름, 기능 요청 문의
          내용도 가계부 데이터로 저장돼요.
        </Section>
        <Section title="2. 이용 목적">
          로그인 인증, 가계부 기능 제공(수입·지출 기록, 통계, 예산, 자산 관리), 비밀번호
          재설정 메일 발송, 기능 요청에 답변이 달렸을 때 알림 메일 발송에만 써요. 광고나
          마케팅에 이용하지 않아요.
        </Section>
        <Section title="3. 보유 및 이용 기간">
          회원 탈퇴 전까지 보관하고, 탈퇴하면 이름·이메일·비밀번호 등 계정 정보는 즉시
          삭제해요. 다만 다른 구성원과 함께 쓰는 가계부의 거래 내역·자산 정보는 가계부 자체의
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
          {`서버 인프라는 Amazon Web Services(AWS) 서울 리전(국내)에서 운영하고 있어요. 비밀번호 재설정, 기능 요청 답변 등 서비스 이용에 꼭 필요한 이메일은 같은 AWS 계정의 이메일 발송 서비스(SES)를 통해 발송하며, 이 과정에서 수신자 이메일 주소와 메일 본문(재설정 링크 등)만 전달돼요. 위 위탁·인프라 모두 국내에서 처리되어 개인정보를 국외로 이전하지 않아요.

· Amazon Web Services(AWS) — 서버·데이터베이스 운영, 이메일(SES) 발송 — 대한민국(서울 리전)`}
        </Section>
        <Section title="6. 제3자 제공">
          위에 적은 경우를 빼면, 수집한 정보를 다른 곳에 제공하거나 판매하지 않아요.
        </Section>
        <Section title="7. 안전성 확보조치">
          비밀번호는 암호화하여 저장하고, 모든 통신 구간은 HTTPS로 암호화해요. 가계부 데이터는
          같은 가계부 구성원만 조회할 수 있도록 접근 권한을 제한하고 있어요. 비밀번호 재설정
          링크는 추측할 수 없는 1회용 토큰으로 발급되고 30분간만 유효하며, 사용하거나 시간이
          지나면 즉시 무효화돼요.
        </Section>
        <Section title="8. 이용자의 권리">
          이용자는 언제든지 운영자에게 본인의 개인정보 열람, 정정, 삭제, 처리정지를 요구하거나
          동의를 철회할 수 있어요. 앱 내 설정 화면에서 계정 정보 확인·수정과 탈퇴(삭제)를 바로
          할 수 있고, 그 외의 권리 행사는 아래 개인정보 보호책임자에게 이메일로 요청하면 지체
          없이 조치해드려요.
        </Section>
        <View className="gap-1.5">
          <Text className="text-base font-semibold text-slate-900">계정 삭제 방법</Text>
          <Text className="text-sm leading-6 text-slate-600">
            로그인이 안 되는 경우를 포함한 계정 삭제 방법 전체 안내는{' '}
            <Link href="/delete-account" className="font-medium text-primary">
              여기
            </Link>
            에서 확인할 수 있어요.
          </Text>
        </View>
        <Section title="9. 만 14세 미만 아동의 개인정보">
          이 서비스는 만 14세 이상을 대상으로 제공되며, 만 14세 미만 아동의 회원가입은 허용하지
          않아요. 운영자는 만 14세 미만 아동의 개인정보를 알면서 수집하지 않으며, 가입 시 생년월일로
          연령을 확인해 이를 확인·차단하고 있어요.
        </Section>
        <Section title="10. 권익침해 구제방법">
          {`개인정보 처리에 대한 불만이나 상담이 필요하면 아래 기관에도 문의할 수 있어요.

· 개인정보분쟁조정위원회: (국번없이) 1833-6972 / www.kopico.go.kr
· 개인정보침해신고센터: (국번없이) 118 / privacy.kisa.or.kr
· 대검찰청 사이버수사과: (국번없이) 1301 / www.spo.go.kr
· 경찰청 사이버수사국: (국번없이) 182 / ecrm.police.go.kr`}
        </Section>
        <Section title="11. 개인정보 보호책임자">
          {`이 서비스는 1인 운영으로 별도 사업자 등록 없이 제공돼요. 개인정보 관련 문의·불만 처리는 아래로 연락해주세요.

이메일: doslxk@gmail.com`}
        </Section>
        <Section title="12. 방침의 변경">
          이 방침의 내용이 바뀌면 시행일을 갱신하고, 시행 최소 7일 전(이용자의 권리에 중요한
          영향을 주는 변경은 30일 전)부터 앱 내 공지를 통해 알려드릴게요.
        </Section>
      </View>
      </Screen>
    </>
  );
}
