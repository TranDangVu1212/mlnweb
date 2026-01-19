const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Load data
let servicesData = {};
try {
    servicesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'services.json'), 'utf8'));
} catch (error) {
    console.error('Error loading services data:', error);
}

// In-memory storage for contacts and tracking
const contacts = [];
const trackingData = new Map();

// ============ API ROUTES ============

// Get all categories
app.get('/api/categories', (req, res) => {
    res.json({
        success: true,
        data: servicesData.categories || []
    });
});

// Get all services with pagination and filtering
app.get('/api/services', (req, res) => {
    const { category, search, page = 1, limit = 10, status } = req.query;
    let services = servicesData.services || [];

    // Filter by category
    if (category) {
        services = services.filter(s => s.categoryId === category);
    }

    // Filter by status
    if (status) {
        services = services.filter(s => s.status === status);
    }

    // Search by name or description
    if (search) {
        const searchLower = search.toLowerCase();
        services = services.filter(s => 
            s.name.toLowerCase().includes(searchLower) ||
            s.shortDescription.toLowerCase().includes(searchLower)
        );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedServices = services.slice(startIndex, endIndex);

    res.json({
        success: true,
        data: paginatedServices,
        pagination: {
            total: services.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(services.length / limit)
        }
    });
});

// Get popular services
app.get('/api/services/popular', (req, res) => {
    const { limit = 6 } = req.query;
    const services = servicesData.services || [];
    
    // Sort by views and get top services
    const popularServices = [...services]
        .sort((a, b) => b.views - a.views)
        .slice(0, parseInt(limit));

    res.json({
        success: true,
        data: popularServices
    });
});

// Get single service by ID
app.get('/api/services/:id', (req, res) => {
    const { id } = req.params;
    const service = (servicesData.services || []).find(s => s.id === id);

    if (!service) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy dịch vụ'
        });
    }

    // Increment view count (in production, this would update DB)
    service.views = (service.views || 0) + 1;

    // Get category info
    const category = (servicesData.categories || []).find(c => c.id === service.categoryId);

    // Get related services
    const relatedServices = (service.relatedServices || [])
        .map(relId => (servicesData.services || []).find(s => s.id === relId))
        .filter(Boolean);

    res.json({
        success: true,
        data: {
            ...service,
            category,
            relatedServices
        }
    });
});

// Get election information
app.get('/api/elections', (req, res) => {
    res.json({
        success: true,
        data: servicesData.elections || {}
    });
});

// Election notification subscriptions storage
const electionSubscriptions = [];

// Subscribe to election notifications
app.post('/api/elections/subscribe', (req, res) => {
    const { email, phone, name, province, district, ward } = req.body;

    if (!email && !phone) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp email hoặc số điện thoại'
        });
    }

    // Check duplicate
    const existing = electionSubscriptions.find(s => 
        (email && s.email === email) || (phone && s.phone === phone)
    );

    if (existing) {
        return res.status(400).json({
            success: false,
            message: 'Email hoặc số điện thoại đã được đăng ký'
        });
    }

    const subscription = {
        id: Date.now(),
        email: email || '',
        phone: phone || '',
        name: name || '',
        province: province || '',
        district: district || '',
        ward: ward || '',
        createdAt: new Date().toISOString(),
        status: 'active'
    };

    electionSubscriptions.push(subscription);

    res.json({
        success: true,
        message: 'Đăng ký thành công! Bạn sẽ nhận được thông báo về cuộc bầu cử.',
        data: { subscriptionId: `SUB${subscription.id}` }
    });
});

// Check voter registration
app.post('/api/elections/check-voter', (req, res) => {
    const { idNumber, fullName, birthYear } = req.body;

    if (!idNumber || !fullName || !birthYear) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp đầy đủ thông tin (CCCD, họ tên, năm sinh)'
        });
    }

    // Demo data for voter check
    const demoVoters = {
        '001234567890': {
            idNumber: '001234567890',
            fullName: 'Nguyễn Văn An',
            birthYear: 1990,
            registered: true,
            pollingStation: {
                name: 'Khu vực bỏ phiếu số 5',
                address: 'Nhà văn hóa phường Hàng Bạc, 25 Hàng Bạc, Hoàn Kiếm, Hà Nội',
                ward: 'Phường Hàng Bạc',
                district: 'Quận Hoàn Kiếm',
                province: 'Thành phố Hà Nội',
                voterNumber: 1234,
                constituency: 'Đơn vị bầu cử số 1 - Quận Hoàn Kiếm'
            }
        },
        '079123456789': {
            idNumber: '079123456789',
            fullName: 'Trần Thị Bình',
            birthYear: 1985,
            registered: true,
            pollingStation: {
                name: 'Khu vực bỏ phiếu số 12',
                address: 'Trường Tiểu học Nguyễn Thái Sơn, 200 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM',
                ward: 'Phường 8',
                district: 'Quận Phú Nhuận',
                province: 'Thành phố Hồ Chí Minh',
                voterNumber: 5678,
                constituency: 'Đơn vị bầu cử số 3 - Quận Phú Nhuận'
            }
        }
    };

    const voter = demoVoters[idNumber];

    if (!voter) {
        // Return a simulated result for demo purposes
        const age = 2026 - parseInt(birthYear);
        if (age < 18) {
            return res.json({
                success: true,
                data: {
                    registered: false,
                    reason: 'Chưa đủ 18 tuổi tính đến ngày bầu cử (24/05/2026)',
                    suggestion: 'Bạn sẽ đủ điều kiện bầu cử khi đủ 18 tuổi.'
                }
            });
        }

        return res.json({
            success: true,
            data: {
                registered: false,
                reason: 'Không tìm thấy thông tin trong cơ sở dữ liệu',
                suggestion: 'Vui lòng liên hệ UBND xã/phường nơi cư trú để đăng ký hoặc kiểm tra lại thông tin.'
            }
        });
    }

    // Verify name and birth year
    if (voter.fullName.toLowerCase() !== fullName.toLowerCase() || voter.birthYear !== parseInt(birthYear)) {
        return res.json({
            success: true,
            data: {
                registered: false,
                reason: 'Thông tin không khớp',
                suggestion: 'Vui lòng kiểm tra lại họ tên và năm sinh. Nếu cần hỗ trợ, liên hệ UBND xã/phường.'
            }
        });
    }

    res.json({
        success: true,
        data: {
            registered: true,
            voter: voter
        }
    });
});

// Lookup polling station by location
app.get('/api/elections/polling-stations', (req, res) => {
    const { province, district, ward } = req.query;

    // Demo polling stations data
    const pollingStations = [
        {
            id: 1,
            name: 'Khu vực bỏ phiếu số 1',
            address: 'UBND Phường Hàng Bạc, 38 Hàng Bạc, Hoàn Kiếm, Hà Nội',
            ward: 'Phường Hàng Bạc',
            district: 'Quận Hoàn Kiếm',
            province: 'Thành phố Hà Nội',
            openTime: '07:00',
            closeTime: '21:00',
            capacity: 800,
            phone: '024-3826-xxxx'
        },
        {
            id: 2,
            name: 'Khu vực bỏ phiếu số 2',
            address: 'Nhà văn hóa phường Hàng Bông, 15 Hàng Bông, Hoàn Kiếm, Hà Nội',
            ward: 'Phường Hàng Bông',
            district: 'Quận Hoàn Kiếm',
            province: 'Thành phố Hà Nội',
            openTime: '07:00',
            closeTime: '21:00',
            capacity: 1000,
            phone: '024-3828-xxxx'
        },
        {
            id: 3,
            name: 'Khu vực bỏ phiếu số 5',
            address: 'Trường Tiểu học Nguyễn Thái Sơn, 200 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM',
            ward: 'Phường 8',
            district: 'Quận Phú Nhuận',
            province: 'Thành phố Hồ Chí Minh',
            openTime: '07:00',
            closeTime: '21:00',
            capacity: 1200,
            phone: '028-3844-xxxx'
        },
        {
            id: 4,
            name: 'Khu vực bỏ phiếu số 8',
            address: 'UBND Phường 10, 256 Lê Văn Sỹ, Quận 3, TP.HCM',
            ward: 'Phường 10',
            district: 'Quận 3',
            province: 'Thành phố Hồ Chí Minh',
            openTime: '07:00',
            closeTime: '21:00',
            capacity: 950,
            phone: '028-3930-xxxx'
        }
    ];

    let results = pollingStations;

    if (province) {
        results = results.filter(s => s.province.toLowerCase().includes(province.toLowerCase()));
    }
    if (district) {
        results = results.filter(s => s.district.toLowerCase().includes(district.toLowerCase()));
    }
    if (ward) {
        results = results.filter(s => s.ward.toLowerCase().includes(ward.toLowerCase()));
    }

    res.json({
        success: true,
        data: results,
        total: results.length
    });
});

// Get election news/announcements
app.get('/api/elections/news', (req, res) => {
    const { limit = 10 } = req.query;

    const electionNews = [
        {
            id: 1,
            title: 'Công bố ngày bầu cử Quốc hội khóa XVI',
            summary: 'Quốc hội đã thông qua Nghị quyết ấn định ngày bầu cử đại biểu Quốc hội khóa XVI và đại biểu HĐND các cấp nhiệm kỳ 2026-2031 là ngày Chủ nhật, 24/05/2026.',
            content: 'Đây là cuộc bầu cử có ý nghĩa quan trọng, là ngày hội của toàn dân, là dịp để nhân dân thực hiện quyền làm chủ, lựa chọn những đại biểu xứng đáng đại diện cho ý chí và nguyện vọng của nhân dân.',
            date: '2026-01-15',
            category: 'Thông báo chính thức',
            important: true
        },
        {
            id: 2,
            title: 'Hướng dẫn kiểm tra danh sách cử tri',
            summary: 'Công dân có thể kiểm tra tên mình trong danh sách cử tri tại UBND xã/phường nơi cư trú hoặc tra cứu trực tuyến qua Cổng Dịch vụ công.',
            content: 'Danh sách cử tri được niêm yết công khai từ ngày 24/04/2026. Mọi công dân đều có quyền kiểm tra và khiếu nại nếu không có tên hoặc thông tin không chính xác.',
            date: '2026-01-12',
            category: 'Hướng dẫn',
            important: false
        },
        {
            id: 3,
            title: 'Tiêu chuẩn người ứng cử đại biểu Quốc hội',
            summary: 'Người ứng cử đại biểu Quốc hội phải đủ 21 tuổi trở lên, là công dân Việt Nam, trung thành với Tổ quốc và Hiến pháp.',
            content: 'Ngoài ra, người ứng cử phải có phẩm chất đạo đức tốt, gương mẫu chấp hành pháp luật, có trình độ và năng lực thực hiện nhiệm vụ đại biểu, liên hệ chặt chẽ với nhân dân.',
            date: '2026-01-10',
            category: 'Quy định',
            important: false
        },
        {
            id: 4,
            title: 'Các hành vi bị nghiêm cấm trong bầu cử',
            summary: 'Pháp luật nghiêm cấm các hành vi dùng vũ lực, đe dọa, lừa dối, mua chuộc hoặc cản trở công dân thực hiện quyền bầu cử.',
            content: 'Vi phạm các quy định về bầu cử có thể bị xử lý hành chính hoặc truy cứu trách nhiệm hình sự tùy theo mức độ vi phạm.',
            date: '2026-01-08',
            category: 'Quy định',
            important: true
        },
        {
            id: 5,
            title: 'Quy trình bỏ phiếu tại khu vực bầu cử',
            summary: 'Cử tri cần mang theo CCCD/CMND và Thẻ cử tri khi đến điểm bỏ phiếu. Thời gian bỏ phiếu từ 07:00 đến 21:00.',
            content: 'Cử tri sẽ được kiểm tra giấy tờ, nhận phiếu bầu, vào buồng kín để gạch tên và tự tay bỏ phiếu vào hòm phiếu.',
            date: '2026-01-05',
            category: 'Hướng dẫn',
            important: false
        }
    ];

    res.json({
        success: true,
        data: electionNews.slice(0, parseInt(limit))
    });
});

// Get candidates info (demo)
app.get('/api/elections/candidates', (req, res) => {
    const { constituency, position } = req.query;

    const demoCandidates = [
        {
            id: 1,
            name: 'Nguyễn Văn Minh',
            birthYear: 1975,
            gender: 'Nam',
            ethnicity: 'Kinh',
            religion: 'Không',
            education: 'Tiến sĩ Kinh tế',
            occupation: 'Giảng viên Đại học Quốc gia Hà Nội',
            position: 'Đại biểu Quốc hội',
            constituency: 'Đơn vị bầu cử số 1 - Quận Hoàn Kiếm',
            party: 'Đảng viên Đảng Cộng sản Việt Nam',
            nominations: ['Ủy ban MTTQ Việt Nam', 'Hội Khoa học Kinh tế Việt Nam'],
            bio: 'Có nhiều năm kinh nghiệm trong lĩnh vực giáo dục và nghiên cứu kinh tế.'
        },
        {
            id: 2,
            name: 'Trần Thị Hương',
            birthYear: 1980,
            gender: 'Nữ',
            ethnicity: 'Kinh',
            religion: 'Không',
            education: 'Thạc sĩ Quản trị Kinh doanh',
            occupation: 'Giám đốc Doanh nghiệp',
            position: 'Đại biểu Quốc hội',
            constituency: 'Đơn vị bầu cử số 1 - Quận Hoàn Kiếm',
            party: 'Đảng viên Đảng Cộng sản Việt Nam',
            nominations: ['Hội Liên hiệp Phụ nữ Việt Nam'],
            bio: 'Có nhiều đóng góp cho sự phát triển doanh nghiệp và tạo việc làm.'
        }
    ];

    let results = demoCandidates;

    if (constituency) {
        results = results.filter(c => c.constituency.toLowerCase().includes(constituency.toLowerCase()));
    }
    if (position) {
        results = results.filter(c => c.position.toLowerCase().includes(position.toLowerCase()));
    }

    res.json({
        success: true,
        data: results
    });
});

// Get detailed election statistics
app.get('/api/elections/statistics', (req, res) => {
    const stats = {
        totalVoters: 70235412,
        registeredVoters: 69845123,
        registrationRate: 99.44,
        totalConstituencies: 184,
        nationalAssemblySeats: 500,
        provincialCouncilSeats: 3842,
        districtCouncilSeats: 21945,
        wardCouncilSeats: 289452,
        pollingStations: 85432,
        provinces: 63,
        electionCommittees: 11234,
        volunteerStaff: 856000,
        byRegion: [
            { region: 'Đồng bằng sông Hồng', voters: 15234567, percentage: 21.7 },
            { region: 'Đông Bắc Bộ', voters: 9845123, percentage: 14.0 },
            { region: 'Tây Bắc Bộ', voters: 3456789, percentage: 4.9 },
            { region: 'Bắc Trung Bộ', voters: 8123456, percentage: 11.6 },
            { region: 'Nam Trung Bộ', voters: 6789012, percentage: 9.7 },
            { region: 'Tây Nguyên', voters: 4567890, percentage: 6.5 },
            { region: 'Đông Nam Bộ', voters: 12345678, percentage: 17.6 },
            { region: 'Đồng bằng sông Cửu Long', voters: 9872897, percentage: 14.0 }
        ],
        demographics: {
            male: 48.2,
            female: 51.8,
            ethnicMinorities: 14.7,
            firstTimeVoters: 8.5,
            overseasVoters: 125000
        },
        lastUpdated: new Date().toISOString()
    };

    res.json({
        success: true,
        data: stats
    });
});

// Get election FAQ
app.get('/api/elections/faq', (req, res) => {
    const { category } = req.query;
    
    const faqData = [
        {
            id: 1,
            category: 'general',
            question: 'Ngày bầu cử Quốc hội khóa XVI là khi nào?',
            answer: 'Ngày bầu cử đại biểu Quốc hội khóa XVI và đại biểu HĐND các cấp nhiệm kỳ 2026-2031 là ngày Chủ nhật, 24 tháng 5 năm 2026.',
            views: 15234
        },
        {
            id: 2,
            category: 'voter',
            question: 'Điều kiện để được ghi tên vào danh sách cử tri?',
            answer: 'Công dân Việt Nam đủ 18 tuổi trở lên tính đến ngày bầu cử, có đầy đủ năng lực hành vi dân sự và không thuộc các trường hợp bị tước quyền bầu cử theo quy định của pháp luật.',
            views: 12456
        },
        {
            id: 3,
            category: 'voter',
            question: 'Tôi có thể bỏ phiếu ở đâu nếu đi công tác/du lịch vào ngày bầu cử?',
            answer: 'Bạn có thể đăng ký xin cấp giấy chứng nhận để bỏ phiếu ở nơi khác. Liên hệ UBND xã/phường nơi cư trú trước ngày bầu cử ít nhất 48 giờ để làm thủ tục.',
            views: 8934
        },
        {
            id: 4,
            category: 'procedure',
            question: 'Thời gian bỏ phiếu là từ mấy giờ đến mấy giờ?',
            answer: 'Thời gian bỏ phiếu bắt đầu từ 07:00 sáng và kết thúc lúc 21:00 cùng ngày. Tùy theo tình hình thực tế, một số điểm bỏ phiếu có thể mở sớm hơn nhưng không trước 05:00.',
            views: 7845
        },
        {
            id: 5,
            category: 'procedure',
            question: 'Cần mang những giấy tờ gì khi đi bỏ phiếu?',
            answer: 'Cử tri cần mang theo: 1) Căn cước công dân hoặc Chứng minh nhân dân, 2) Thẻ cử tri (nếu đã được cấp). Trong trường hợp chưa có Thẻ cử tri, vẫn có thể bỏ phiếu nếu xuất trình được giấy tờ tùy thân hợp lệ.',
            views: 11234
        },
        {
            id: 6,
            category: 'candidate',
            question: 'Làm thế nào để biết thông tin về các ứng cử viên?',
            answer: 'Thông tin về các ứng cử viên sẽ được niêm yết tại các điểm bỏ phiếu, UBND xã/phường và đăng tải trên Cổng thông tin điện tử của địa phương trước ngày bầu cử ít nhất 10 ngày.',
            views: 9567
        },
        {
            id: 7,
            category: 'candidate',
            question: 'Tiêu chuẩn của người ứng cử đại biểu Quốc hội?',
            answer: 'Người ứng cử phải: đủ 21 tuổi trở lên, là công dân Việt Nam, trung thành với Tổ quốc và Hiến pháp, có phẩm chất đạo đức tốt, có trình độ và năng lực thực hiện nhiệm vụ đại biểu.',
            views: 6789
        },
        {
            id: 8,
            category: 'invalid',
            question: 'Trường hợp nào phiếu bầu bị coi là không hợp lệ?',
            answer: 'Phiếu không hợp lệ: phiếu không theo mẫu quy định, phiếu không có dấu của Tổ bầu cử, phiếu gạch xóa hoặc sửa chữa làm mất giá trị, phiếu để số người được bầu nhiều hơn số đại biểu được bầu, phiếu ghi thêm tên người ngoài danh sách.',
            views: 5432
        },
        {
            id: 9,
            category: 'special',
            question: 'Người cao tuổi, khuyết tật có được hỗ trợ khi bỏ phiếu không?',
            answer: 'Có. Cử tri cao tuổi, khuyết tật, ốm đau không thể tự viết được phiếu bầu có quyền nhờ người khác viết hộ, nhưng phải tự mình bỏ phiếu. Tổ bầu cử có thể mang hòm phiếu phụ đến nơi ở để cử tri bỏ phiếu.',
            views: 4567
        },
        {
            id: 10,
            category: 'complaint',
            question: 'Tôi có thể khiếu nại nếu không có tên trong danh sách cử tri?',
            answer: 'Có. Bạn có quyền khiếu nại với UBND xã/phường nơi lập danh sách cử tri. UBND phải xem xét, giải quyết trong vòng 3 ngày. Nếu không đồng ý với kết quả, bạn có quyền khiếu nại tiếp lên Tòa án nhân dân.',
            views: 3456
        }
    ];

    let results = faqData;
    if (category) {
        results = faqData.filter(f => f.category === category);
    }

    res.json({
        success: true,
        data: results,
        categories: [
            { id: 'general', name: 'Thông tin chung' },
            { id: 'voter', name: 'Cử tri' },
            { id: 'procedure', name: 'Quy trình bỏ phiếu' },
            { id: 'candidate', name: 'Ứng cử viên' },
            { id: 'invalid', name: 'Phiếu không hợp lệ' },
            { id: 'special', name: 'Trường hợp đặc biệt' },
            { id: 'complaint', name: 'Khiếu nại' }
        ]
    });
});

// Get election calendar/events
app.get('/api/elections/calendar', (req, res) => {
    const events = [
        {
            id: 1,
            title: 'Công bố danh sách cử tri',
            date: '2026-04-24',
            endDate: '2026-05-09',
            type: 'milestone',
            description: 'Danh sách cử tri được niêm yết công khai tại UBND xã/phường',
            location: 'Toàn quốc'
        },
        {
            id: 2,
            title: 'Hội nghị cử tri nơi cư trú',
            date: '2026-04-20',
            endDate: '2026-05-03',
            type: 'event',
            description: 'Tổ chức hội nghị cử tri để lấy ý kiến nhận xét về người ứng cử',
            location: 'Các xã/phường'
        },
        {
            id: 3,
            title: 'Vận động bầu cử',
            date: '2026-05-04',
            endDate: '2026-05-22',
            type: 'campaign',
            description: 'Thời gian vận động bầu cử của các ứng cử viên',
            location: 'Toàn quốc'
        },
        {
            id: 4,
            title: 'Kết thúc nhận đơn xin bỏ phiếu nơi khác',
            date: '2026-05-22',
            type: 'deadline',
            description: 'Hạn cuối nộp đơn xin giấy chứng nhận bỏ phiếu ở nơi khác',
            location: 'UBND xã/phường'
        },
        {
            id: 5,
            title: 'NGÀY BẦU CỬ',
            date: '2026-05-24',
            type: 'election-day',
            description: 'Ngày bầu cử đại biểu Quốc hội khóa XVI và đại biểu HĐND các cấp',
            location: '85,000+ điểm bỏ phiếu toàn quốc',
            time: '07:00 - 21:00'
        },
        {
            id: 6,
            title: 'Công bố kết quả bầu cử',
            date: '2026-06-13',
            type: 'result',
            description: 'Hội đồng bầu cử quốc gia công bố kết quả bầu cử chính thức',
            location: 'Hà Nội'
        }
    ];

    res.json({
        success: true,
        data: events
    });
});

// Submit voter feedback/report
const voterFeedbacks = [];
app.post('/api/elections/feedback', (req, res) => {
    const { type, subject, description, location, contactEmail, contactPhone, anonymous } = req.body;

    if (!type || !subject || !description) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp đầy đủ thông tin (loại, tiêu đề, mô tả)'
        });
    }

    const feedback = {
        id: Date.now(),
        type,
        subject,
        description,
        location: location || '',
        contactEmail: anonymous ? '' : (contactEmail || ''),
        contactPhone: anonymous ? '' : (contactPhone || ''),
        anonymous: anonymous || false,
        status: 'received',
        createdAt: new Date().toISOString(),
        ticketCode: `FB${Date.now().toString().slice(-8)}`
    };

    voterFeedbacks.push(feedback);

    res.json({
        success: true,
        message: 'Phản ánh của bạn đã được tiếp nhận. Chúng tôi sẽ xem xét và phản hồi sớm nhất.',
        data: {
            ticketCode: feedback.ticketCode,
            status: 'received'
        }
    });
});

// Get election live results (placeholder for election day)
app.get('/api/elections/results', (req, res) => {
    const now = new Date();
    const electionDate = new Date('2026-05-24T07:00:00');
    
    if (now < electionDate) {
        return res.json({
            success: true,
            data: {
                status: 'not-started',
                message: 'Kết quả bầu cử sẽ được cập nhật vào ngày 24/05/2026',
                electionDate: '2026-05-24',
                countdown: Math.floor((electionDate - now) / (1000 * 60 * 60 * 24))
            }
        });
    }

    // Demo results for after election
    res.json({
        success: true,
        data: {
            status: 'counting',
            lastUpdated: new Date().toISOString(),
            nationalAssembly: {
                totalSeats: 500,
                counted: 0,
                turnout: 0
            },
            byProvince: [],
            message: 'Đang kiểm phiếu...'
        }
    });
});

// Get news
app.get('/api/news', (req, res) => {
    const { limit = 5 } = req.query;
    const news = (servicesData.news || []).slice(0, parseInt(limit));

    res.json({
        success: true,
        data: news
    });
});

// Get statistics
app.get('/api/statistics', (req, res) => {
    res.json({
        success: true,
        data: servicesData.statistics || {}
    });
});

// Submit contact form
app.post('/api/contact', (req, res) => {
    const { name, email, message, phone } = req.body;

    // Validation
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
        });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Email không hợp lệ'
        });
    }

    // Save contact (in production, this would save to DB)
    const contact = {
        id: Date.now(),
        name,
        email,
        phone: phone || '',
        message,
        createdAt: new Date().toISOString(),
        status: 'pending'
    };

    contacts.push(contact);

    res.json({
        success: true,
        message: 'Câu hỏi của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi trong vòng 24 giờ.',
        data: {
            ticketId: `DVC${contact.id}`
        }
    });
});

// Track application status
app.get('/api/tracking/:code', (req, res) => {
    const { code } = req.params;

    // Demo tracking data
    const demoTracking = {
        'HS2024001234': {
            code: 'HS2024001234',
            serviceName: 'Cấp CCCD gắn chip lần đầu',
            applicantName: 'Nguyễn Văn A',
            submittedDate: '2026-01-15',
            status: 'processing',
            statusText: 'Đang xử lý',
            steps: [
                { name: 'Tiếp nhận hồ sơ', status: 'completed', date: '2026-01-15 09:30' },
                { name: 'Kiểm tra hồ sơ', status: 'completed', date: '2026-01-15 14:00' },
                { name: 'Xử lý hồ sơ', status: 'processing', date: '2026-01-16' },
                { name: 'Phê duyệt', status: 'pending', date: '' },
                { name: 'Trả kết quả', status: 'pending', date: '' }
            ],
            estimatedCompletion: '2026-01-22',
            agency: 'Công an quận Hoàn Kiếm'
        },
        'HS2024005678': {
            code: 'HS2024005678',
            serviceName: 'Đăng ký khai sinh',
            applicantName: 'Trần Thị B',
            submittedDate: '2026-01-10',
            status: 'completed',
            statusText: 'Hoàn thành',
            steps: [
                { name: 'Tiếp nhận hồ sơ', status: 'completed', date: '2026-01-10 10:00' },
                { name: 'Kiểm tra hồ sơ', status: 'completed', date: '2026-01-10 11:30' },
                { name: 'Xử lý hồ sơ', status: 'completed', date: '2026-01-11 09:00' },
                { name: 'Phê duyệt', status: 'completed', date: '2026-01-11 15:00' },
                { name: 'Trả kết quả', status: 'completed', date: '2026-01-12 08:30' }
            ],
            estimatedCompletion: '2026-01-12',
            agency: 'UBND phường Hàng Bạc'
        }
    };

    const tracking = demoTracking[code] || trackingData.get(code);

    if (!tracking) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy hồ sơ với mã số này'
        });
    }

    res.json({
        success: true,
        data: tracking
    });
});

// Search services
app.get('/api/search', (req, res) => {
    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.json({
            success: true,
            data: {
                services: [],
                categories: []
            }
        });
    }

    const searchLower = q.toLowerCase();
    
    // Search services
    const matchedServices = (servicesData.services || [])
        .filter(s => 
            s.name.toLowerCase().includes(searchLower) ||
            s.shortDescription.toLowerCase().includes(searchLower) ||
            s.fullDescription.toLowerCase().includes(searchLower)
        )
        .slice(0, 5);

    // Search categories
    const matchedCategories = (servicesData.categories || [])
        .filter(c => 
            c.name.toLowerCase().includes(searchLower) ||
            c.description.toLowerCase().includes(searchLower)
        )
        .slice(0, 3);

    res.json({
        success: true,
        data: {
            services: matchedServices,
            categories: matchedCategories
        }
    });
});

// Get service by category with full details
app.get('/api/categories/:id/services', (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const category = (servicesData.categories || []).find(c => c.id === id);
    
    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy danh mục'
        });
    }

    const services = (servicesData.services || []).filter(s => s.categoryId === id);
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedServices = services.slice(startIndex, endIndex);

    res.json({
        success: true,
        data: {
            category,
            services: paginatedServices,
            pagination: {
                total: services.length,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(services.length / limit)
            }
        }
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve service detail page
app.get('/dich-vu/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'service-detail.html'));
});

// Serve tracking page
app.get('/tra-cuu', (req, res) => {
    res.sendFile(path.join(__dirname, 'tracking.html'));
});

// Serve election page
app.get('/bau-cu', (req, res) => {
    res.sendFile(path.join(__dirname, 'election.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
    });
});

// 404 handler
app.use((req, res) => {
    if (req.accepts('html')) {
        res.status(404).sendFile(path.join(__dirname, '404.html'));
        return;
    }
    
    res.status(404).json({
        success: false,
        message: 'Không tìm thấy trang hoặc API'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   🇻🇳  CỔNG DỊCH VỤ CÔNG VIỆT NAM                      ║
    ║                                                       ║
    ║   Server đang chạy tại: http://localhost:${PORT}         ║
    ║                                                       ║
    ║   API Endpoints:                                      ║
    ║   • GET  /api/categories                              ║
    ║   • GET  /api/services                                ║
    ║   • GET  /api/services/popular                        ║
    ║   • GET  /api/services/:id                            ║
    ║   • GET  /api/elections                               ║
    ║   • GET  /api/news                                    ║
    ║   • GET  /api/statistics                              ║
    ║   • GET  /api/search?q=keyword                        ║
    ║   • GET  /api/tracking/:code                          ║
    ║   • POST /api/contact                                 ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
